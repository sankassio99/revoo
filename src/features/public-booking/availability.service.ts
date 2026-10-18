import "server-only";

import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { getLocalDayBounds, localDateTimeToUtc } from "@/lib/domain/time";
import { timeZoneSchema } from "@/lib/validation/common";
import { publicAvailabilityQuerySchema } from "@/features/public-booking/public-booking.schema";
import { PublicBookingError, getPublicBookingWorkspace } from "@/features/public-booking/public-booking.service";
import { getAvailableStartTimes, isServiceSelectionCompatible } from "@/features/public-booking/availability.domain";

export { getAvailableStartTimes, isServiceSelectionCompatible } from "@/features/public-booking/availability.domain";

export async function calculateAvailability(tenantId: string, input: unknown) {
  const parsed = publicAvailabilityQuerySchema.safeParse(input);
  if (!parsed.success) throw new PublicBookingError("Choose a valid professional, service selection, and date.", 400);
  const workspace = await getPublicBookingWorkspace(tenantId);
  const professionalRef = adminDb.doc(`tenants/${tenantId}/professionals/${parsed.data.professionalId}`);
  const settingsRef = adminDb.doc(`tenants/${tenantId}/settings/general`);
  const [professional, settings] = await Promise.all([professionalRef.get(), settingsRef.get()]);
  if (!professional.exists || professional.get("status") !== "active") {
    throw new PublicBookingError("Professional not found.", 404);
  }
  const assignments: unknown = professional.get("serviceIds");
  if (!Array.isArray(assignments) || !isServiceSelectionCompatible(assignments, parsed.data.serviceIds)) {
    throw new PublicBookingError("Selected services are not available with this professional.", 400);
  }
  const serviceSnapshots = await adminDb.getAll(
    ...parsed.data.serviceIds.map((id) => adminDb.doc(`tenants/${tenantId}/services/${id}`)),
  );
  if (serviceSnapshots.some((service) => !service.exists || service.get("status") !== "active")) {
    throw new PublicBookingError("Selected service not found.", 404);
  }
  const durations = serviceSnapshots.map((service) => service.get("durationMinutes"));
  const prices = serviceSnapshots.map((service) => service.get("priceMinorUnits"));
  if (
    !durations.every((value) => Number.isSafeInteger(value) && (value as number) > 0) ||
    !prices.every((value) => Number.isSafeInteger(value) && (value as number) >= 0)
  ) throw new PublicBookingError("Selected service has invalid booking details.", 400);
  const durationMinutes = (durations as number[]).reduce((sum, value) => sum + value, 0);
  const priceMinorUnits = (prices as number[]).reduce((sum, value) => sum + value, 0);
  if (!Number.isSafeInteger(durationMinutes) || !Number.isSafeInteger(priceMinorUnits)) {
    throw new PublicBookingError("Selected service has invalid booking details.", 400);
  }

  const data = settings.data() ?? {};
  const settingsTimeZone = timeZoneSchema.safeParse(data.timeZone);
  if (!settings.exists || !settingsTimeZone.success || settingsTimeZone.data !== workspace.timeZone) {
    throw new PublicBookingError("Workspace booking is not configured.", 404);
  }
  const localNoon = localDateTimeToUtc(`${parsed.data.date}T12:00`, workspace.timeZone);
  const bounds = getLocalDayBounds(localNoon, workspace.timeZone);
  const appointmentSnapshots = await adminDb
    .collection(`tenants/${tenantId}/appointments`)
    .where("professionalId", "==", parsed.data.professionalId)
    .where("startAtUtc", "<", Timestamp.fromDate(bounds.end))
    .get();
  const appointments = appointmentSnapshots.docs.flatMap((appointment) => {
    const start = appointment.get("startAtUtc");
    const end = appointment.get("endAtUtc");
    if (appointment.get("status") === "Cancelled" || !start || !end) return [];
    const startAt = typeof start.toDate === "function" ? start.toDate() : null;
    const endAt = typeof end.toDate === "function" ? end.toDate() : null;
    return startAt && endAt ? [{ startAt, endAt, status: String(appointment.get("status") ?? "Scheduled") }] : [];
  });
  const availableTimes = getAvailableStartTimes({
    date: parsed.data.date,
    timeZone: workspace.timeZone,
    operatingHours: data.operatingHours ?? {},
    durationMinutes,
    appointments,
    professionalServiceIds: assignments,
    selectedServiceIds: parsed.data.serviceIds,
  });
  return { date: parsed.data.date, timeZone: workspace.timeZone, durationMinutes, priceMinorUnits, availableTimes };
}
