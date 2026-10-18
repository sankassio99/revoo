import { getLocalDateTime } from "@/lib/domain/time";

export function buildPublicAppointmentConfirmation(input: {
  id?: string;
  workspaceName: string;
  professionalName: string;
  services: Array<{ name: string; durationMinutes: number; priceMinorUnits: number }>;
  startAt: Date;
  endAt: Date;
  timeZone: string;
  status: string;
}) {
  return {
    ...(input.id ? { id: input.id } : {}),
    workspaceName: input.workspaceName,
    professionalName: input.professionalName,
    services: input.services,
    localStart: getLocalDateTime(input.startAt, input.timeZone),
    localEnd: getLocalDateTime(input.endAt, input.timeZone),
    timeZone: input.timeZone,
    status: input.status,
  };
}
