import "server-only";

import { FieldValue, Timestamp, type DocumentData } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { updateScheduleGuard } from "@/features/appointments/schedule-guard";
import { appointmentIntervalOverlaps } from "@/features/appointments/appointment.schema";
import { customerEmailIndexKey, normalizeCustomerEmail } from "@/features/customers/customer-email-index";
import { getLocalDateTime, localDateTimeToUtc } from "@/lib/domain/time";
import { timeZoneSchema } from "@/lib/validation/common";
import { publicAppointmentInputSchema, publicClientEmailSchema } from "@/features/public-booking/public-booking.schema";
import { PublicBookingError, getPublicBookingWorkspace } from "@/features/public-booking/public-booking.service";
import { buildPublicAppointmentConfirmation } from "@/features/public-booking/public-appointment.domain";

export { buildPublicAppointmentConfirmation } from "@/features/public-booking/public-appointment.domain";

const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;

function minuteOfDay(value: unknown) {
  if (typeof value !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return null;
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

function calculateInterval(settings: DocumentData, localStart: string, durationMinutes: number, timeZone: string) {
  const date = localStart.slice(0, 10);
  const day = new Date(`${date}T00:00:00.000Z`).getUTCDay();
  const hours = settings.operatingHours?.[weekdays[day]];
  const open = minuteOfDay(hours?.open);
  const close = minuteOfDay(hours?.close);
  const startMinute = minuteOfDay(localStart.slice(11));
  if (hours?.closed === true || open === null || close === null || startMinute === null || open >= close || startMinute < open) {
    throw new PublicBookingError("The full appointment must fit within workspace operating hours.", 400);
  }
  if ((startMinute - open) % 15 !== 0) {
    throw new PublicBookingError("Choose a start time on the workspace booking grid.", 400);
  }
  let startAt: Date;
  try { startAt = localDateTimeToUtc(localStart, timeZone); }
  catch { throw new PublicBookingError("Choose a valid local appointment time.", 400); }
  const endAt = new Date(startAt.getTime() + durationMinutes * 60_000);
  if (startAt <= new Date()) throw new PublicBookingError("Choose a future appointment time.", 409);
  const localEnd = getLocalDateTime(endAt, timeZone);
  const endMinute = minuteOfDay(localEnd.slice(11));
  if (localEnd.slice(0, 10) !== date || endMinute === null || endMinute > close || endMinute <= startMinute) {
    throw new PublicBookingError("The full appointment must fit within workspace operating hours.", 400);
  }
  return { startAt, endAt };
}

export async function createPublicAppointment(tenantId: string, input: unknown) {
  const parsed = publicAppointmentInputSchema.safeParse(input);
  if (!parsed.success) throw new PublicBookingError("Choose a valid professional, services, and local start time.", 400);
  const email = publicClientEmailSchema.safeParse(parsed.data.email);
  if (!email.success) throw new PublicBookingError("Enter a valid email address.", 400);
  const normalizedEmail = normalizeCustomerEmail(email.data);
  await getPublicBookingWorkspace(tenantId);

  const appointmentRef = adminDb.collection(`tenants/${tenantId}/appointments`).doc();
  const serviceIds = parsed.data.serviceIds;
  const indexRef = adminDb.doc(`tenants/${tenantId}/customerEmailIndex/${customerEmailIndexKey(normalizedEmail)}`);
  const workspaceRef = adminDb.doc(`tenants/${tenantId}`);
  const settingsRef = adminDb.doc(`tenants/${tenantId}/settings/general`);
  const professionalRef = adminDb.doc(`tenants/${tenantId}/professionals/${parsed.data.professionalId}`);
  const serviceRefs = serviceIds.map((id) => adminDb.doc(`tenants/${tenantId}/services/${id}`));

  return adminDb.runTransaction(async (transaction) => {
    const [workspace, settings, index, professional, ...services] = await Promise.all([
      transaction.get(workspaceRef),
      transaction.get(settingsRef),
      transaction.get(indexRef),
      transaction.get(professionalRef),
      ...serviceRefs.map((ref) => transaction.get(ref)),
    ]);
    if (!workspace.exists || !settings.exists) throw new PublicBookingError("Workspace not found.", 404);
    if (index.get("status") === "ambiguous") throw new PublicBookingError("We could not safely match this email. Please contact the workspace.", 409);
    const customerId = index.get("customerId");
    if (index.get("status") !== "active" || typeof customerId !== "string") {
      throw new PublicBookingError("Check your email against a client profile before booking.", 404);
    }
    const customerRef = adminDb.doc(`tenants/${tenantId}/customers/${customerId}`);
    const customer = await transaction.get(customerRef);
    if (!customer.exists || customer.get("isArchived") === true || customer.get("archivedAt") !== undefined) {
      throw new PublicBookingError("Check your email against a client profile before booking.", 404);
    }
    const customerEmail = customer.get("email");
    if (typeof customerEmail !== "string" || normalizeCustomerEmail(customerEmail) !== normalizedEmail) {
      throw new PublicBookingError("We could not safely match this email. Please contact the workspace.", 409);
    }
    if (!professional.exists || professional.get("status") !== "active") {
      throw new PublicBookingError("Professional is no longer available.", 404);
    }
    if (services.some((service) => !service.exists || service.get("status") !== "active")) {
      throw new PublicBookingError("A selected service is no longer available.", 404);
    }
    const assignments: unknown = professional.get("serviceIds");
    if (!Array.isArray(assignments) || !serviceIds.every((id) => assignments.includes(id))) {
      throw new PublicBookingError("The professional is no longer assigned to every selected service.", 409);
    }

    const durations = services.map((service) => service.get("durationMinutes"));
    const prices = services.map((service) => service.get("priceMinorUnits"));
    if (!durations.every((value) => Number.isSafeInteger(value) && (value as number) > 0) ||
        !prices.every((value) => Number.isSafeInteger(value) && (value as number) >= 0)) {
      throw new PublicBookingError("A selected service has invalid booking details.", 400);
    }
    const durationMinutes = (durations as number[]).reduce((sum, value) => sum + value, 0);
    const priceMinorUnits = (prices as number[]).reduce((sum, value) => sum + value, 0);
    if (!Number.isSafeInteger(durationMinutes) || !Number.isSafeInteger(priceMinorUnits)) {
      throw new PublicBookingError("Selected booking details exceed the supported range.", 400);
    }
    const timeZone = timeZoneSchema.safeParse(settings.get("timeZone"));
    if (!timeZone.success || timeZone.data !== workspace.get("timeZone")) {
      throw new PublicBookingError("Workspace booking is not configured.", 404);
    }
    const interval = calculateInterval(settings.data() ?? {}, parsed.data.localStart, durationMinutes, timeZone.data);
    const guardRef = adminDb.doc(`tenants/${tenantId}/scheduleGuards/${parsed.data.professionalId}`);
    await transaction.get(guardRef);
    const overlaps = await transaction.get(
      adminDb.collection(`tenants/${tenantId}/appointments`)
        .where("professionalId", "==", parsed.data.professionalId)
        .where("startAtUtc", "<", Timestamp.fromDate(interval.endAt)),
    );
    const conflict = overlaps.docs.some((appointment) => {
      if (appointment.get("status") === "Cancelled") return false;
      const start = appointment.get("startAtUtc");
      const end = appointment.get("endAtUtc");
      if (typeof start?.toDate !== "function" || typeof end?.toDate !== "function") return false;
      return appointmentIntervalOverlaps({ startAt: start.toDate(), endAt: end.toDate() }, interval);
    });
    if (conflict) throw new PublicBookingError("That time is no longer available.", 409);

    const serviceSnapshots = services.map((service) => ({
      id: service.id,
      name: String(service.get("name") ?? "Service"),
      durationMinutes: service.get("durationMinutes") as number,
      priceMinorUnits: service.get("priceMinorUnits") as number,
    }));
    const workspaceName = String(workspace.get("name") ?? "Workspace");
    const professionalName = String(professional.get("name") ?? "Professional");
    const scheduledStatus = "Scheduled";
    transaction.create(appointmentRef, {
      customerId,
      serviceId: serviceIds[0],
      serviceIds,
      professionalId: parsed.data.professionalId,
      startAtUtc: Timestamp.fromDate(interval.startAt),
      endAtUtc: Timestamp.fromDate(interval.endAt),
      timeZoneAtBooking: timeZone.data,
      serviceSnapshot: {
        name: serviceSnapshots.map((service) => service.name).join(", "),
        durationMinutes,
        priceMinorUnits,
        services: serviceSnapshots,
      },
      status: scheduledStatus,
      amountChargedMinorUnits: null,
      createdBy: "public-booking",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      changeHistory: [{ actorId: "public-booking", occurredAt: Timestamp.now(), changedFields: ["created"], before: null, after: scheduledStatus }],
    });
    updateScheduleGuard(transaction, tenantId, parsed.data.professionalId);
    return {
      appointment: buildPublicAppointmentConfirmation({
        id: appointmentRef.id,
        workspaceName,
        professionalName,
        services: serviceSnapshots,
        startAt: interval.startAt,
        endAt: interval.endAt,
        timeZone: timeZone.data,
        status: scheduledStatus,
      }),
    };
  });
}
