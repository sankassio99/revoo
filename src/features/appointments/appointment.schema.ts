import { z } from "zod";

const recordIdSchema = z.string().min(1).max(128);

export const appointmentStatusSchema = z.enum([
  "Scheduled",
  "Confirmed",
  "Completed",
  "Cancelled",
  "NoShow",
]);

export const appointmentInputSchema = z.object({
  customerId: recordIdSchema,
  serviceIds: z.array(recordIdSchema).min(1).max(20),
  professionalId: recordIdSchema,
  localStart: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/),
});

export const appointmentActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("reschedule"),
    appointmentId: recordIdSchema,
    localStart: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/),
  }),
  z.object({
    action: z.literal("status"),
    appointmentId: recordIdSchema,
    status: appointmentStatusSchema,
    amountChargedMinorUnits: z.number().int().nonnegative().safe().optional(),
  }),
]);

export type AppointmentStatus = z.infer<typeof appointmentStatusSchema>;

type AppointmentInterval = { startAt: Date; endAt: Date };

export function appointmentIntervalOverlaps(
  first: AppointmentInterval,
  second: AppointmentInterval,
) {
  return first.startAt < second.endAt && first.endAt > second.startAt;
}

const allowedTransitions: Record<AppointmentStatus, AppointmentStatus[]> = {
  Scheduled: ["Confirmed", "Completed", "Cancelled", "NoShow"],
  Confirmed: ["Completed", "Cancelled", "NoShow"],
  Completed: [],
  Cancelled: [],
  NoShow: [],
};

export function canTransitionAppointment(
  from: AppointmentStatus,
  to: AppointmentStatus,
) {
  return allowedTransitions[from].includes(to);
}
