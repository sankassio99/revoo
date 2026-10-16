import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import type { SessionUser } from "@/lib/auth/session";
import {
  requireWorkspaceMember,
  requireWorkspaceOwner,
} from "@/lib/auth/authorization";
import {
  professionalInputSchema,
  professionalUpdateSchema,
  serviceInputSchema,
  serviceUpdateSchema,
} from "@/features/catalog/catalog.schema";

export async function listCatalog(user: SessionUser, tenantId: string) {
  await requireWorkspaceMember(user, tenantId);
  const [services, professionals] = await Promise.all([
    adminDb.collection(`tenants/${tenantId}/services`).orderBy("name").get(),
    adminDb.collection(`tenants/${tenantId}/professionals`).orderBy("name").get(),
  ]);

  return {
    services: services.docs.map((service) => ({
      id: service.id,
      name: String(service.get("name") ?? "Service"),
      durationMinutes: Number(service.get("durationMinutes") ?? 0),
      priceMinorUnits: Number(service.get("priceMinorUnits") ?? 0),
      status: service.get("status") === "inactive" ? ("inactive" as const) : ("active" as const),
    })),
    professionals: professionals.docs.map((professional) => ({
      id: professional.id,
      name: String(professional.get("name") ?? "Professional"),
      serviceIds: Array.isArray(professional.get("serviceIds"))
        ? (professional.get("serviceIds") as string[])
        : [],
      status:
        professional.get("status") === "inactive"
          ? ("inactive" as const)
          : ("active" as const),
    })),
  };
}

export async function createService(
  user: SessionUser,
  tenantId: string,
  input: unknown,
) {
  await requireWorkspaceOwner(user, tenantId);
  const parsed = serviceInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error("Enter a valid service name, duration, and non-negative price.");
  }

  const service = adminDb.collection(`tenants/${tenantId}/services`).doc();
  await service.create({
    ...parsed.data,
    status: "active",
    createdBy: user.uid,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return service.id;
}

async function validateServiceReferences(tenantId: string, serviceIds: string[]) {
  if (new Set(serviceIds).size !== serviceIds.length) {
    throw new Error("Each service can be selected only once.");
  }
  const references = serviceIds.map((id) =>
    adminDb.doc(`tenants/${tenantId}/services/${id}`),
  );
  const services = references.length > 0 ? await adminDb.getAll(...references) : [];
  if (services.some((service) => !service.exists)) {
    throw new Error("Select services that belong to this workspace.");
  }
}

export async function createProfessional(
  user: SessionUser,
  tenantId: string,
  input: unknown,
) {
  await requireWorkspaceOwner(user, tenantId);
  const parsed = professionalInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error("Enter a professional name and at least one workspace service.");
  }
  await validateServiceReferences(tenantId, parsed.data.serviceIds);

  const professional = adminDb
    .collection(`tenants/${tenantId}/professionals`)
    .doc();
  await professional.create({
    ...parsed.data,
    status: "active",
    createdBy: user.uid,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return professional.id;
}

export async function updateCatalogRecord(
  user: SessionUser,
  tenantId: string,
  kind: "service" | "professional",
  recordId: string,
  input: unknown,
) {
  await requireWorkspaceOwner(user, tenantId);
  const reference = adminDb.doc(
    `tenants/${tenantId}/${kind === "service" ? "services" : "professionals"}/${recordId}`,
  );
  const current = await reference.get();
  if (!current.exists) throw new Error("Catalog record not found.");

  if (kind === "service") {
    const parsed = serviceUpdateSchema.safeParse(input);
    if (!parsed.success || Object.keys(parsed.data).length === 0) {
      throw new Error("Provide valid service details to update.");
    }
    await reference.update({ ...parsed.data, updatedAt: FieldValue.serverTimestamp() });
    return;
  }

  const parsed = professionalUpdateSchema.safeParse(input);
  if (!parsed.success || Object.keys(parsed.data).length === 0) {
    throw new Error("Provide valid professional details to update.");
  }
  if (parsed.data.serviceIds) {
    await validateServiceReferences(tenantId, parsed.data.serviceIds);
  }
  await reference.update({ ...parsed.data, updatedAt: FieldValue.serverTimestamp() });
}
