import "server-only";

import { adminDb } from "@/lib/firebase/admin";
import { getPublicBookingWorkspace } from "@/features/public-booking/public-booking.service";

export async function getPublicBookingOptions(tenantId: string) {
  const workspace = await getPublicBookingWorkspace(tenantId);
  const [services, professionals] = await Promise.all([
    adminDb.collection(`tenants/${tenantId}/services`).orderBy("name").get(),
    adminDb.collection(`tenants/${tenantId}/professionals`).orderBy("name").get(),
  ]);

  const publicServices = services.docs.flatMap((service) => {
    const name: unknown = service.get("name");
    const durationMinutes: unknown = service.get("durationMinutes");
    const priceMinorUnits: unknown = service.get("priceMinorUnits");
    if (
      service.get("status") !== "active" ||
      typeof name !== "string" || !name.trim() ||
      !Number.isSafeInteger(durationMinutes) || (durationMinutes as number) <= 0 ||
      !Number.isSafeInteger(priceMinorUnits) || (priceMinorUnits as number) < 0
    ) return [];
    return [{ id: service.id, name: name.trim(), durationMinutes: durationMinutes as number, priceMinorUnits: priceMinorUnits as number }];
  });
  const activeServiceIds = new Set(publicServices.map((service) => service.id));
  const publicProfessionals = professionals.docs.flatMap((professional) => {
    const name: unknown = professional.get("name");
    const assigned: unknown = professional.get("serviceIds");
    if (professional.get("status") !== "active" || typeof name !== "string" || !name.trim()) return [];
    return [{
      id: professional.id,
      name: name.trim(),
      serviceIds: Array.isArray(assigned)
        ? [...new Set(assigned.filter((id): id is string => typeof id === "string" && activeServiceIds.has(id)))]
        : [],
    }];
  });

  return { workspace, services: publicServices, professionals: publicProfessionals };
}
