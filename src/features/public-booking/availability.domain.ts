import { appointmentIntervalOverlaps } from "@/features/appointments/appointment.schema";
import { getLocalDayBounds, getLocalDateTime, localDateTimeToUtc } from "@/lib/domain/time";
import { timeZoneSchema } from "@/lib/validation/common";
import { publicDateSchema } from "@/features/public-booking/public-booking.schema";

const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;
type Hours = { closed?: unknown; open?: unknown; close?: unknown };
export type AppointmentInterval = { startAt: Date; endAt: Date; status?: string };

function localMinute(value: unknown) {
  if (typeof value !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return null;
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

export function isServiceSelectionCompatible(professionalServiceIds: string[], selectedServiceIds: string[]) {
  return selectedServiceIds.length > 0 && selectedServiceIds.every((id) => professionalServiceIds.includes(id));
}

export function getAvailableStartTimes(input: {
  date: string;
  timeZone: string;
  operatingHours: Record<string, Hours>;
  durationMinutes: number;
  appointments: AppointmentInterval[];
  professionalServiceIds?: string[];
  selectedServiceIds?: string[];
  now?: Date;
}) {
  if (
    input.professionalServiceIds && input.selectedServiceIds &&
    !isServiceSelectionCompatible(input.professionalServiceIds, input.selectedServiceIds)
  ) return [];
  const parsedDate = publicDateSchema.safeParse(input.date);
  const parsedZone = timeZoneSchema.safeParse(input.timeZone);
  if (!parsedDate.success || !parsedZone.success || !Number.isSafeInteger(input.durationMinutes) || input.durationMinutes <= 0) return [];

  const day = new Date(`${input.date}T00:00:00.000Z`).getUTCDay();
  const hours = input.operatingHours[weekdays[day]];
  const opening = localMinute(hours?.open);
  const closing = localMinute(hours?.close);
  if (hours?.closed === true || opening === null || closing === null || opening >= closing) return [];

  const now = input.now ?? new Date();
  const localNoon = localDateTimeToUtc(`${input.date}T12:00`, input.timeZone);
  const bounds = getLocalDayBounds(localNoon, input.timeZone);
  const available: string[] = [];
  for (let startMinute = opening; startMinute + input.durationMinutes <= closing; startMinute += 15) {
    const hour = String(Math.floor(startMinute / 60)).padStart(2, "0");
    const minute = String(startMinute % 60).padStart(2, "0");
    const localStart = `${input.date}T${hour}:${minute}`;
    try {
      const startAt = localDateTimeToUtc(localStart, input.timeZone);
      const endAt = new Date(startAt.getTime() + input.durationMinutes * 60_000);
      if (startAt <= now || startAt < bounds.start || startAt >= bounds.end) continue;
      if (getLocalDateTime(endAt, input.timeZone).slice(0, 10) !== input.date) continue;
      if (input.appointments.some((appointment) => appointment.status !== "Cancelled" && appointmentIntervalOverlaps(appointment, { startAt, endAt }))) continue;
      available.push(`${hour}:${minute}`);
    } catch {
      // Local wall times skipped or repeated by a clock change are not bookable.
    }
  }
  return available;
}
