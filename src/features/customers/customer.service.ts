import "server-only";

import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import type { SessionUser } from "@/lib/auth/session";
import { requireWorkspaceMember } from "@/lib/auth/authorization";
import {
  customerInputSchema,
  customerSearchTerms,
  normalizeCustomerSearch,
  customerUpdateSchema,
  type CommunicationPreferences,
} from "@/features/customers/customer.schema";

export type CustomerRecord = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  notes: string;
  communicationPreferences: CommunicationPreferences;
};

function toCustomerRecord(id: string, value: FirebaseFirestore.DocumentData): CustomerRecord {
  return {
    id,
    name: typeof value.name === "string" ? value.name : "Unnamed customer",
    phone: typeof value.phone === "string" ? value.phone : "",
    email: typeof value.email === "string" ? value.email : null,
    notes: typeof value.notes === "string" ? value.notes : "",
    communicationPreferences: {
      whatsappService: value.communicationPreferences?.whatsappService ?? "unknown",
      whatsappMarketing: value.communicationPreferences?.whatsappMarketing ?? "unknown",
      emailMarketing: value.communicationPreferences?.emailMarketing ?? "unknown",
    },
  };
}

function consentEvents(
  userId: string,
  preferences: CommunicationPreferences,
  method: string,
) {
  return Object.entries(preferences)
    .filter(([, state]) => state !== "unknown")
    .map(([key, state]) => {
      const [channel, purpose] = key === "whatsappService"
        ? ["whatsapp", "service"]
        : key === "whatsappMarketing"
          ? ["whatsapp", "marketing"]
          : ["email", "marketing"];
      return {
        state,
        purpose,
        channel,
        capturedAt: Timestamp.now(),
        source: userId,
        method,
      };
    });
}

export async function listCustomers(
  user: SessionUser,
  tenantId: string,
  search = "",
) {
  await requireWorkspaceMember(user, tenantId);
  const collection = adminDb.collection(`tenants/${tenantId}/customers`);
  const normalizedSearch = normalizeCustomerSearch(search);
  if (normalizedSearch) {
    const phoneDigits = search.replace(/\D/g, "");
    const terms = [...new Set([normalizedSearch, phoneDigits].filter(Boolean))];
    const results = await Promise.all(
      terms.map((term) =>
        collection
          .where("isArchived", "==", false)
          .where("searchTerms", "array-contains", term)
          .limit(100)
          .get(),
      ),
    );
    const documents = new Map(results.flatMap((result) => result.docs).map((doc) => [doc.id, doc]));
    return [...documents.values()]
      .map((customer) => toCustomerRecord(customer.id, customer.data()));
  }

  const snapshot = await collection
    .where("isArchived", "==", false)
    .orderBy("name")
    .limit(100)
    .get();
  return snapshot.docs
    .map((customer) => toCustomerRecord(customer.id, customer.data()));
}

export async function createCustomer(
  user: SessionUser,
  tenantId: string,
  input: unknown,
) {
  await requireWorkspaceMember(user, tenantId);
  const parsed = customerInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error("Enter a customer name, valid phone number, and optional valid email.");
  }

  const name = parsed.data.name;
  const phone = parsed.data.phone;
  const nameNormalized = normalizeCustomerSearch(name);
  const phoneNormalized = phone.replace(/\D/g, "");
  if (phoneNormalized.length < 7) {
    throw new Error("Enter a phone number with at least seven digits.");
  }

  const customers = adminDb.collection(`tenants/${tenantId}/customers`);
  const [sameName, samePhone] = await Promise.all([
    customers.where("nameNormalized", "==", nameNormalized).get(),
    customers.where("phoneNormalized", "==", phoneNormalized).get(),
  ]);
  const possibleDuplicate = [...sameName.docs, ...samePhone.docs].some(
    (customer) =>
      customer.get("isArchived") !== true &&
      customer.get("archivedAt") === undefined,
  );

  const customer = customers.doc();
  const communicationPreferences: CommunicationPreferences = {
    whatsappService: parsed.data.communicationPreferences?.whatsappService ?? "unknown",
    whatsappMarketing: parsed.data.communicationPreferences?.whatsappMarketing ?? "unknown",
    emailMarketing: parsed.data.communicationPreferences?.emailMarketing ?? "unknown",
  };
  const events = consentEvents(
    user.uid,
    communicationPreferences,
    parsed.data.consentMethod ?? "other",
  );
  await customer.create({
    name,
    phone,
    phoneNormalized,
    nameNormalized,
    searchTerms: customerSearchTerms(name, phone),
    isArchived: false,
    email: parsed.data.email || null,
    notes: parsed.data.notes ?? "",
    communicationPreferences,
    consentEvidence: events,
    createdBy: user.uid,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { id: customer.id, possibleDuplicate };
}

export async function updateCustomer(
  user: SessionUser,
  tenantId: string,
  customerId: string,
  input: unknown,
) {
  await requireWorkspaceMember(user, tenantId);
  const parsed = customerUpdateSchema.safeParse(input);
  if (!parsed.success || Object.keys(parsed.data).length === 0) {
    throw new Error("Provide valid customer details to update.");
  }

  const customer = adminDb.doc(`tenants/${tenantId}/customers/${customerId}`);
  const existing = await customer.get();
  if (!existing.exists || existing.get("isArchived") === true || existing.get("archivedAt") !== undefined) {
    throw new Error("Customer not found.");
  }

  const name = parsed.data.name ?? String(existing.get("name") ?? "");
  const phone = parsed.data.phone ?? String(existing.get("phone") ?? "");
  const nameNormalized = normalizeCustomerSearch(name);
  const phoneNormalized = phone.replace(/\D/g, "");
  if (phoneNormalized.length < 7) {
    throw new Error("Enter a phone number with at least seven digits.");
  }

  const customers = adminDb.collection(`tenants/${tenantId}/customers`);
  const [sameName, samePhone] = await Promise.all([
    customers.where("nameNormalized", "==", nameNormalized).get(),
    customers.where("phoneNormalized", "==", phoneNormalized).get(),
  ]);
  const possibleDuplicate = [...sameName.docs, ...samePhone.docs].some(
    (candidate) =>
      candidate.id !== customerId &&
      candidate.get("isArchived") !== true &&
      candidate.get("archivedAt") === undefined,
  );

  const existingPreferences = existing.get("communicationPreferences") ?? {};
  const communicationPreferences: CommunicationPreferences = {
    whatsappService:
      parsed.data.communicationPreferences?.whatsappService ??
      existingPreferences.whatsappService ??
      "unknown",
    whatsappMarketing:
      parsed.data.communicationPreferences?.whatsappMarketing ??
      existingPreferences.whatsappMarketing ??
      "unknown",
    emailMarketing:
      parsed.data.communicationPreferences?.emailMarketing ??
      existingPreferences.emailMarketing ??
      "unknown",
  };
  const preferenceChanged =
    JSON.stringify(communicationPreferences) !== JSON.stringify(existingPreferences);
  const evidence = preferenceChanged
    ? consentEvents(
        user.uid,
        communicationPreferences,
        parsed.data.consentMethod ?? "other",
      )
    : [];
  await customer.update({
    ...(parsed.data.name !== undefined ? { name } : {}),
    ...(parsed.data.phone !== undefined ? { phone } : {}),
    ...(parsed.data.email !== undefined ? { email: parsed.data.email || null } : {}),
    ...(parsed.data.notes !== undefined ? { notes: parsed.data.notes } : {}),
    ...(parsed.data.communicationPreferences
      ? { communicationPreferences }
      : {}),
    ...(evidence.length ? { consentEvidence: FieldValue.arrayUnion(...evidence) } : {}),
    ...(parsed.data.name !== undefined || parsed.data.phone !== undefined
      ? {
          nameNormalized,
          phoneNormalized,
          searchTerms: customerSearchTerms(name, phone),
        }
      : {}),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { possibleDuplicate };
}

export async function getCustomer(
  user: SessionUser,
  tenantId: string,
  customerId: string,
) {
  await requireWorkspaceMember(user, tenantId);
  const snapshot = await adminDb.doc(`tenants/${tenantId}/customers/${customerId}`).get();
  if (!snapshot.exists || snapshot.get("isArchived") === true || snapshot.get("archivedAt") !== undefined) {
    return null;
  }
  return toCustomerRecord(snapshot.id, snapshot.data() ?? {});
}

export async function getCustomerAppointmentHistory(
  user: SessionUser,
  tenantId: string,
  customerId: string,
) {
  await requireWorkspaceMember(user, tenantId);
  const customer = await getCustomer(user, tenantId, customerId);
  if (!customer) return null;

  const appointments = await adminDb
    .collection(`tenants/${tenantId}/appointments`)
    .where("customerId", "==", customerId)
    .orderBy("startAtUtc", "desc")
    .limit(50)
    .get();

  return appointments.docs.map((appointment) => {
    const data = appointment.data();
    return {
      id: appointment.id,
      status: typeof data.status === "string" ? data.status : "Scheduled",
      startAtUtc:
        data.startAtUtc instanceof Date
          ? data.startAtUtc
          : typeof data.startAtUtc?.toDate === "function"
            ? data.startAtUtc.toDate()
            : null,
      serviceName:
        typeof data.serviceSnapshot?.name === "string"
          ? data.serviceSnapshot.name
          : "Appointment",
    };
  });
}

export async function archiveCustomer(
  user: SessionUser,
  tenantId: string,
  customerId: string,
) {
  await requireWorkspaceMember(user, tenantId);
  const customer = adminDb.doc(`tenants/${tenantId}/customers/${customerId}`);
  const snapshot = await customer.get();
  if (!snapshot.exists || snapshot.get("isArchived") === true || snapshot.get("archivedAt") !== undefined) {
    return false;
  }

  await customer.update({
    archivedAt: FieldValue.serverTimestamp(),
    isArchived: true,
    archivedBy: user.uid,
    updatedAt: FieldValue.serverTimestamp(),
  });
  return true;
}
