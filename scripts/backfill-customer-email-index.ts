import { createHash } from "node:crypto";
import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { getFirestore } from "firebase-admin/firestore";

function initializeBackfillDb() {
  const app = getApps()[0] ?? (() => {
    const projectId = process.env.FIREBASE_PROJECT_ID ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? process.env.GCLOUD_PROJECT;
    if (!projectId) throw new Error("FIREBASE_PROJECT_ID must be configured for the customer email-index backfill.");
    const serviceAccount = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    let credential = applicationDefault();
    if (serviceAccount) {
      const parsed = JSON.parse(serviceAccount) as { client_email: string; private_key: string };
      credential = cert({ projectId, clientEmail: parsed.client_email, privateKey: parsed.private_key.replace(/\\n/g, "\n") });
    }
    return initializeApp({ credential, projectId });
  })();
  return getFirestore(app);
}

const adminDb = initializeBackfillDb();

function normalizeCustomerEmail(email: string) { return email.trim().toLowerCase(); }
function customerEmailIndexKey(email: string) { return createHash("sha256").update(normalizeCustomerEmail(email)).digest("hex"); }
function isValidEmail(value: string) { return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); }

export type CustomerEmailIndexBackfillResult = {
  tenantsScanned: number;
  customersScanned: number;
  indexed: number;
  duplicates: Array<{ tenantId: string; emailKey: string; customerIds: string[] }>;
};

export async function backfillCustomerEmailIndex(db: Firestore = adminDb): Promise<CustomerEmailIndexBackfillResult> {
  const tenants = await db.collection("tenants").get();
  const result: CustomerEmailIndexBackfillResult = {
    tenantsScanned: tenants.size,
    customersScanned: 0,
    indexed: 0,
    duplicates: [],
  };

  for (const tenant of tenants.docs) {
    const customers = await db.collection(`tenants/${tenant.id}/customers`).get();
    result.customersScanned += customers.size;
    const grouped = new Map<string, string[]>();
    for (const customer of customers.docs) {
      const rawEmail: unknown = customer.get("email");
      if (
        customer.get("isArchived") === true || customer.get("archivedAt") !== undefined ||
        typeof rawEmail !== "string"
      ) continue;
      const normalizedEmail = normalizeCustomerEmail(rawEmail);
      if (!isValidEmail(normalizedEmail)) continue;
      const key = customerEmailIndexKey(normalizedEmail);
      grouped.set(key, [...(grouped.get(key) ?? []), customer.id]);
    }

    for (const [emailKey, customerIds] of grouped) {
      const index = db.doc(`tenants/${tenant.id}/customerEmailIndex/${emailKey}`);
      await db.runTransaction(async (transaction) => {
        await transaction.get(index);
        const unique = customerIds.length === 1;
        transaction.set(index, unique
          ? { status: "active", customerId: customerIds[0], updatedAt: FieldValue.serverTimestamp() }
          : { status: "ambiguous", updatedAt: FieldValue.serverTimestamp() });
      });
      if (customerIds.length === 1) result.indexed += 1;
      else result.duplicates.push({ tenantId: tenant.id, emailKey, customerIds: [...customerIds] });
    }
  }

  return result;
}

if (process.argv[1]?.replace(/\\/g, "/").endsWith("scripts/backfill-customer-email-index.ts")) {
  backfillCustomerEmailIndex().then((result) => {
    console.info(JSON.stringify(result, null, 2));
  }).catch((error: unknown) => {
    console.error("Customer email-index backfill failed.", error);
    process.exitCode = 1;
  });
}
