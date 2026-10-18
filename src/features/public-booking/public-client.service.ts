import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { customerEmailIndexKey, normalizeCustomerEmail } from "@/features/customers/customer-email-index";
import { customerSearchTerms, normalizeCustomerSearch } from "@/features/customers/customer.schema";
import { publicClientEmailSchema, publicClientRegistrationSchema } from "@/features/public-booking/public-booking.schema";
import { PublicBookingError, getPublicBookingWorkspace } from "@/features/public-booking/public-booking.service";

export type PublicBookingIdentity = { email: string };

function normalizeIdentity(identity: PublicBookingIdentity) {
  const email = publicClientEmailSchema.safeParse(identity.email);
  if (!email.success) throw new PublicBookingError("Enter a valid email address.", 400);
  return { email: normalizeCustomerEmail(email.data) };
}

function isActiveClient(snapshot: FirebaseFirestore.DocumentSnapshot) {
  return snapshot.exists && snapshot.get("isArchived") !== true && snapshot.get("archivedAt") === undefined;
}

export async function resolvePublicClient(tenantId: string, identity: PublicBookingIdentity) {
  const provided = normalizeIdentity(identity);
  await getPublicBookingWorkspace(tenantId);
  const emailKey = customerEmailIndexKey(provided.email);
  const index = await adminDb.doc(`tenants/${tenantId}/customerEmailIndex/${emailKey}`).get();
  if (!index.exists) return { client: null, registrationRequired: true };
  if (index.get("status") === "ambiguous") {
    throw new PublicBookingError("We could not safely match this email. Please contact the workspace.", 409);
  }
  const customerId = index.get("customerId");
  if (index.get("status") !== "active" || typeof customerId !== "string") {
    throw new PublicBookingError("We could not safely match this email. Please contact the workspace.", 409);
  }
  const customer = await adminDb.doc(`tenants/${tenantId}/customers/${customerId}`).get();
  if (!isActiveClient(customer)) return { client: null, registrationRequired: true };
  const storedEmail = customer.get("email");
  if (typeof storedEmail !== "string" || normalizeCustomerEmail(storedEmail) !== provided.email) {
    throw new PublicBookingError("We could not safely match this email. Please contact the workspace.", 409);
  }
  return {
    client: { id: customer.id, name: String(customer.get("name") ?? "Client") },
    registrationRequired: false,
  };
}

export async function registerPublicClient(
  tenantId: string,
  identity: PublicBookingIdentity,
  input: unknown,
) {
  const provided = normalizeIdentity(identity);
  const parsed = publicClientRegistrationSchema.safeParse(input);
  if (!parsed.success) throw new PublicBookingError("Enter a valid name and phone number.", 400);
  if (normalizeCustomerEmail(parsed.data.email) !== provided.email) {
    throw new PublicBookingError("The registration email does not match the email lookup.", 400);
  }
  await getPublicBookingWorkspace(tenantId);
  const emailKey = customerEmailIndexKey(provided.email);
  const customers = adminDb.collection(`tenants/${tenantId}/customers`);
  const customer = customers.doc();
  const index = adminDb.doc(`tenants/${tenantId}/customerEmailIndex/${emailKey}`);
  return adminDb.runTransaction(async (transaction) => {
    const indexSnapshot = await transaction.get(index);
    if (indexSnapshot.exists) {
      if (indexSnapshot.get("status") === "ambiguous") {
        throw new PublicBookingError("We could not safely match this email. Please contact the workspace.", 409);
      }
      const existingId = indexSnapshot.get("customerId");
      if (indexSnapshot.get("status") !== "active" || typeof existingId !== "string") {
        throw new PublicBookingError("We could not safely match this email. Please contact the workspace.", 409);
      }
      const existingRef = adminDb.doc(`tenants/${tenantId}/customers/${existingId}`);
      const existing = await transaction.get(existingRef);
      if (isActiveClient(existing)) {
        const storedEmail = existing.get("email");
        if (typeof storedEmail !== "string" || normalizeCustomerEmail(storedEmail) !== provided.email) {
          throw new PublicBookingError("We could not safely match this email. Please contact the workspace.", 409);
        }
        return { client: { id: existing.id, name: String(existing.get("name") ?? "Client") }, registrationRequired: false };
      }
      throw new PublicBookingError("We could not safely match this email. Please contact the workspace.", 409);
    }

    const name = parsed.data.name;
    const phone = parsed.data.phone;
    const phoneNormalized = phone.replace(/\D/g, "");
    transaction.create(customer, {
      name,
      phone,
      phoneNormalized,
      nameNormalized: normalizeCustomerSearch(name),
      searchTerms: customerSearchTerms(name, phone),
      email: provided.email,
      notes: "",
      isArchived: false,
      communicationPreferences: {
        whatsappService: "unknown",
        whatsappMarketing: "unknown",
        emailMarketing: "unknown",
      },
      consentEvidence: [],
      createdBy: "public-booking",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    transaction.create(index, {
      status: "active",
      customerId: customer.id,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { client: { id: customer.id, name }, registrationRequired: false };
  });
}
