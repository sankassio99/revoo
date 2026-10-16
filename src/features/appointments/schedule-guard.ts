import "server-only";

import {
  FieldValue,
  Timestamp,
  type Transaction,
} from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { appointmentIntervalOverlaps } from "@/features/appointments/appointment.schema";

type Interval = { startAt: Date; endAt: Date };

export async function assertNoScheduleConflict(
  transaction: Transaction,
  tenantId: string,
  professionalId: string,
  interval: Interval,
  ignoredAppointmentId?: string,
) {
  const collection = adminDb.collection(`tenants/${tenantId}/appointments`);
  const query = collection
    .where("professionalId", "==", professionalId)
    .where("startAtUtc", "<", Timestamp.fromDate(interval.endAt));
  const appointments = await transaction.get(query);
  const conflict = appointments.docs.some((appointment) => {
    if (appointment.id === ignoredAppointmentId) return false;
    const data = appointment.data();
    if (data.status === "Cancelled" || !data.endAtUtc) return false;
    return appointmentIntervalOverlaps(
      {
        startAt: data.startAtUtc.toDate(),
        endAt: data.endAtUtc.toDate(),
      },
      interval,
    );
  });

  if (conflict) {
    throw new Error("That professional already has an overlapping appointment.");
  }
}

export function updateScheduleGuard(
  transaction: Transaction,
  tenantId: string,
  professionalId: string,
) {
  transaction.set(
    adminDb.doc(`tenants/${tenantId}/scheduleGuards/${professionalId}`),
    {
      revision: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}
