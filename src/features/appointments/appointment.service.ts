import "server-only";

import {
  FieldValue,
  Timestamp,
  type DocumentData,
  type Transaction,
} from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import type { SessionUser } from "@/lib/auth/session";
import { requireWorkspaceMember } from "@/lib/auth/authorization";
import {
  appointmentActionSchema,
  appointmentInputSchema,
  canTransitionAppointment,
  type AppointmentStatus,
} from "@/features/appointments/appointment.schema";
import {
  assertNoScheduleConflict,
  updateScheduleGuard,
} from "@/features/appointments/schedule-guard";
import { getLocalDateTime, localDateTimeToUtc } from "@/lib/domain/time";

const weekdays = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

function localMinute(value: string) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function validateOperatingHours(
  settings: DocumentData,
  localStart: string,
  durationMinutes: number,
  timeZone: string,
) {
  const hours = settings.operatingHours;
  if (!hours || typeof hours !== "object") {
    throw new Error("Set your workspace operating hours before booking appointments.");
  }
  const day = new Date(`${localStart.slice(0, 10)}T00:00:00Z`).getUTCDay();
  const dayHours = hours[weekdays[day]];
  if (!dayHours || dayHours.closed === true) {
    throw new Error("Appointments cannot be booked on a closed day.");
  }

  const opening = localMinute(dayHours.open);
  const closing = localMinute(dayHours.close);
  const start = localMinute(localStart.slice(11));
  if (
    opening === null ||
    closing === null ||
    opening >= closing ||
    start === null ||
    start < opening
  ) {
    throw new Error("The full appointment must fit within workspace operating hours.");
  }

  const utcStart = localDateTimeToUtc(localStart, timeZone);
  const utcEnd = new Date(utcStart.getTime() + durationMinutes * 60_000);
  const localEnd = getLocalDateTime(utcEnd, timeZone);
  const end = localMinute(localEnd.slice(11));
  if (localEnd.slice(0, 10) !== localStart.slice(0, 10)) {
    throw new Error("Appointments cannot run past the end of the local business day.");
  }
  if (end === null || end <= start || end > closing) {
    throw new Error("The full appointment must fit within workspace operating hours.");
  }

  return { startAt: utcStart, endAt: utcEnd };
}

async function readBookingRecords(
  transaction: Transaction,
  tenantId: string,
  customerId: string,
  serviceIds: string[],
  professionalId: string,
) {
  const [customer, services, professional, settings] = await Promise.all([
    transaction.get(adminDb.doc(`tenants/${tenantId}/customers/${customerId}`)),
    Promise.all(
      serviceIds.map((serviceId) =>
        transaction.get(adminDb.doc(`tenants/${tenantId}/services/${serviceId}`)),
      ),
    ),
    transaction.get(adminDb.doc(`tenants/${tenantId}/professionals/${professionalId}`)),
    transaction.get(adminDb.doc(`tenants/${tenantId}/settings/general`)),
  ]);
  if (
    !customer.exists ||
    customer.get("isArchived") === true ||
    customer.get("archivedAt") !== undefined
  ) {
    throw new Error("Choose an active customer in this workspace.");
  }
  if (services.some((service) => !service.exists || service.get("status") !== "active")) {
    throw new Error("Choose an active service in this workspace.");
  }
  if (!professional.exists || professional.get("status") !== "active") {
    throw new Error("Choose an active professional in this workspace.");
  }
  const assigned: unknown = professional.get("serviceIds");
  if (!Array.isArray(assigned) || !serviceIds.every((id) => assigned.includes(id))) {
    throw new Error("This professional is not assigned to the selected service.");
  }
  return { customer, services, professional, settings };
}

function historyEntry(user: SessionUser, changedFields: string[], before: unknown, after: unknown) {
  return {
    actorId: user.uid,
    occurredAt: Timestamp.now(),
    changedFields,
    before,
    after,
  };
}

export async function createAppointment(
  user: SessionUser,
  tenantId: string,
  input: unknown,
) {
  await requireWorkspaceMember(user, tenantId);
  const parsed = appointmentInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error("Choose a customer, service, professional, date, and time.");
  }

  const appointmentRef = adminDb
    .collection(`tenants/${tenantId}/appointments`)
    .doc();
  const serviceIds = [...new Set(parsed.data.serviceIds)];
  const interval = await adminDb.runTransaction(async (transaction) => {
    const records = await readBookingRecords(
      transaction,
      tenantId,
      parsed.data.customerId,
      serviceIds,
      parsed.data.professionalId,
    );
    const durations: unknown[] = records.services.map((s) => s.get("durationMinutes"));
    const prices: unknown[] = records.services.map((s) => s.get("priceMinorUnits"));
    const durationMinutes = durations.reduce<number>((sum, d) => sum + (d as number), 0);
    const priceMinorUnits = prices.reduce<number>((sum, p) => sum + (p as number), 0);
    if (
      !durations.every((d) => Number.isSafeInteger(d) && (d as number) > 0) ||
      !prices.every((p) => Number.isSafeInteger(p) && (p as number) >= 0) ||
      !Number.isSafeInteger(durationMinutes) ||
      !Number.isSafeInteger(priceMinorUnits)
    ) {
      throw new Error("The selected service has invalid booking details.");
    }
    const timeZone = records.settings.get("timeZone");
    if (typeof timeZone !== "string") {
      throw new Error("Set a valid workspace time zone before booking.");
    }
    const slot = validateOperatingHours(
      records.settings.data() ?? {},
      parsed.data.localStart,
      durationMinutes,
      timeZone,
    );
    const guardRef = adminDb.doc(
      `tenants/${tenantId}/scheduleGuards/${parsed.data.professionalId}`,
    );
    await transaction.get(guardRef);
    await assertNoScheduleConflict(
      transaction,
      tenantId,
      parsed.data.professionalId,
      slot,
    );

    transaction.create(appointmentRef, {
      customerId: parsed.data.customerId,
      serviceId: serviceIds[0],
      serviceIds,
      professionalId: parsed.data.professionalId,
      startAtUtc: Timestamp.fromDate(slot.startAt),
      endAtUtc: Timestamp.fromDate(slot.endAt),
      timeZoneAtBooking: timeZone,
      serviceSnapshot: {
        name: records.services.map((s) => s.get("name")).join(", "),
        durationMinutes,
        priceMinorUnits,
      },
      status: "Scheduled",
      amountChargedMinorUnits: null,
      createdBy: user.uid,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      changeHistory: [historyEntry(user, ["created"], null, "Scheduled")],
    });
    updateScheduleGuard(transaction, tenantId, parsed.data.professionalId);
    return slot;
  });

  return { id: appointmentRef.id, ...interval };
}

async function validateReschedule(
  transaction: Transaction,
  tenantId: string,
  user: SessionUser,
  appointmentRef: FirebaseFirestore.DocumentReference,
  localStart: string,
) {
  const appointment = await transaction.get(appointmentRef);
  if (!appointment.exists) throw new Error("Appointment not found.");
  const data = appointment.data()!;
  if (data.status !== "Scheduled" && data.status !== "Confirmed") {
    throw new Error("Only scheduled or confirmed appointments can be rescheduled.");
  }
  const [professional, settings] = await Promise.all([
    transaction.get(
      adminDb.doc(`tenants/${tenantId}/professionals/${data.professionalId}`),
    ),
    transaction.get(adminDb.doc(`tenants/${tenantId}/settings/general`)),
  ]);
  if (!professional.exists || professional.get("status") !== "active") {
    throw new Error("The appointment professional is no longer active.");
  }
  const durationMinutes = data.serviceSnapshot?.durationMinutes;
  const timeZone = settings.get("timeZone");
  if (!Number.isSafeInteger(durationMinutes) || typeof timeZone !== "string") {
    throw new Error("Appointment booking details are incomplete.");
  }
  const slot = validateOperatingHours(
    settings.data() ?? {},
    localStart,
    durationMinutes,
    timeZone,
  );
  const guardRef = adminDb.doc(
    `tenants/${tenantId}/scheduleGuards/${data.professionalId}`,
  );
  await transaction.get(guardRef);
  await assertNoScheduleConflict(
    transaction,
    tenantId,
    data.professionalId,
    slot,
    appointmentRef.id,
  );
  transaction.update(appointmentRef, {
    startAtUtc: Timestamp.fromDate(slot.startAt),
    endAtUtc: Timestamp.fromDate(slot.endAt),
    timeZoneAtBooking: timeZone,
    updatedAt: FieldValue.serverTimestamp(),
    changeHistory: FieldValue.arrayUnion(
      historyEntry(
        user,
        ["startAtUtc", "endAtUtc", "timeZoneAtBooking"],
        { startAtUtc: data.startAtUtc, endAtUtc: data.endAtUtc },
        { startAtUtc: Timestamp.fromDate(slot.startAt), endAtUtc: Timestamp.fromDate(slot.endAt) },
      ),
    ),
  });
  updateScheduleGuard(transaction, tenantId, data.professionalId);
  return slot;
}

async function updateAppointmentStatus(
  transaction: Transaction,
  tenantId: string,
  user: SessionUser,
  appointmentRef: FirebaseFirestore.DocumentReference,
  nextStatus: AppointmentStatus,
  amountChargedMinorUnits?: number,
) {
  const appointment = await transaction.get(appointmentRef);
  if (!appointment.exists) throw new Error("Appointment not found.");
  const data = appointment.data()!;
  const currentStatus = data.status as AppointmentStatus;
  if (!canTransitionAppointment(currentStatus, nextStatus)) {
    throw new Error(`Cannot change an appointment from ${currentStatus} to ${nextStatus}.`);
  }
  if (
    amountChargedMinorUnits !== undefined &&
    nextStatus !== "Completed"
  ) {
    throw new Error("The amount charged can only be recorded when completing an appointment.");
  }
  let customerReference:
    | FirebaseFirestore.DocumentReference
    | undefined;
  let customerSnapshot:
    | FirebaseFirestore.DocumentSnapshot
    | undefined;
  if (nextStatus === "Completed") {
    customerReference = adminDb.doc(
      `tenants/${tenantId}/customers/${data.customerId}`,
    );
    customerSnapshot = await transaction.get(customerReference);
  }
  const update: DocumentData = {
    status: nextStatus,
    updatedAt: FieldValue.serverTimestamp(),
    changeHistory: FieldValue.arrayUnion(
      historyEntry(user, ["status"], currentStatus, nextStatus),
    ),
  };
  if (amountChargedMinorUnits !== undefined) {
    update.amountChargedMinorUnits = amountChargedMinorUnits;
    update.changeHistory = FieldValue.arrayUnion(
      historyEntry(
        user,
        ["status", "amountChargedMinorUnits"],
        { status: currentStatus, amountChargedMinorUnits: data.amountChargedMinorUnits },
        { status: nextStatus, amountChargedMinorUnits },
      ),
    );
  }
  if (nextStatus === "Cancelled") {
    const guardRef = adminDb.doc(
      `tenants/${tenantId}/scheduleGuards/${data.professionalId}`,
    );
    await transaction.get(guardRef);
    updateScheduleGuard(transaction, tenantId, data.professionalId);
  }
  if (customerReference && customerSnapshot?.exists) {
    const previousVisit = customerSnapshot.get("lastVisitAt");
    const appointmentStart = data.startAtUtc as Timestamp;
    if (
      !(previousVisit instanceof Timestamp) ||
      previousVisit.toMillis() < appointmentStart.toMillis()
    ) {
      transaction.update(customerReference, {
        lastVisitAt: appointmentStart,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  }
  transaction.update(appointmentRef, update);
}

export async function updateAppointment(
  user: SessionUser,
  tenantId: string,
  input: unknown,
) {
  await requireWorkspaceMember(user, tenantId);
  const parsed = appointmentActionSchema.safeParse(input);
  if (!parsed.success) throw new Error("Provide a valid appointment update.");
  const reference = adminDb.doc(
    `tenants/${tenantId}/appointments/${parsed.data.appointmentId}`,
  );

  if (parsed.data.action === "reschedule") {
    const { localStart } = parsed.data;
    return adminDb.runTransaction((transaction) =>
      validateReschedule(
        transaction,
        tenantId,
        user,
        reference,
        localStart,
      ),
    );
  }

  const { status, amountChargedMinorUnits } = parsed.data;
  await adminDb.runTransaction((transaction) =>
    updateAppointmentStatus(
      transaction,
      tenantId,
      user,
      reference,
      status,
      amountChargedMinorUnits,
    ),
  );
  return { ok: true };
}

export async function listAppointments(
  user: SessionUser,
  tenantId: string,
  startAt: Date,
  endAt: Date,
) {
  await requireWorkspaceMember(user, tenantId);
  if (!(startAt instanceof Date) || !(endAt instanceof Date) || startAt >= endAt) {
    throw new Error("Choose a valid calendar date range.");
  }
  const appointments = await adminDb
    .collection(`tenants/${tenantId}/appointments`)
    .where("startAtUtc", ">=", Timestamp.fromDate(startAt))
    .where("startAtUtc", "<", Timestamp.fromDate(endAt))
    .orderBy("startAtUtc")
    .get();

  const customerIds = [...new Set(appointments.docs.map((appointment) => appointment.get("customerId") as string))];
  const customers =
    customerIds.length > 0
      ? await adminDb.getAll(
          ...customerIds.map((customerId) =>
            adminDb.doc(`tenants/${tenantId}/customers/${customerId}`),
          ),
        )
      : [];
  const customerDetails = new Map(customers.map((customer) => [customer.id, {
    name: customer.get("name"),
    email: customer.get("email"),
    phone: customer.get("phone"),
  }]));

  return appointments.docs.map((appointment) => {
    const data = appointment.data();
    return {
      id: appointment.id,
      customerId: data.customerId,
      customerName:
        typeof customerDetails.get(data.customerId)?.name === "string"
          ? customerDetails.get(data.customerId)?.name
          : "Customer",
      customerEmail:
        typeof customerDetails.get(data.customerId)?.email === "string"
          ? customerDetails.get(data.customerId)?.email
          : "",
      customerPhone:
        typeof customerDetails.get(data.customerId)?.phone === "string"
          ? customerDetails.get(data.customerId)?.phone
          : "",
      serviceId: data.serviceId,
      serviceName: data.serviceSnapshot?.name ?? "Appointment",
      professionalId: data.professionalId,
      startAt: data.startAtUtc.toDate() as Date,
      endAt: data.endAtUtc.toDate() as Date,
      timeZone: data.timeZoneAtBooking,
      status: data.status as AppointmentStatus,
      amountChargedMinorUnits: data.amountChargedMinorUnits ?? null,
      priceMinorUnits: Number.isSafeInteger(data.serviceSnapshot?.priceMinorUnits)
        ? data.serviceSnapshot.priceMinorUnits
        : 0,
    };
  });
}
