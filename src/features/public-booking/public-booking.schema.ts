import { z } from "zod";
import { tenantIdSchema } from "@/lib/validation/common";

const datePattern = /^(\d{4})-(\d{2})-(\d{2})$/;
const localStartPattern = /^(\d{4})-(\d{2})-(\d{2})T([01]\d|2[0-3]):([0-5]\d)$/;
export const publicRecordIdSchema = z.string().min(1).max(128);

function isCalendarDate(value: string) {
  const match = datePattern.exec(value);
  if (!match) return false;
  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  date.setUTCFullYear(Number(year));
  return Number(year) >= 1 && date.toISOString().slice(0, 10) === value;
}

export const publicTenantIdSchema = tenantIdSchema;
export const publicServiceIdsSchema = z.array(publicRecordIdSchema).min(1).max(20)
  .refine((ids) => new Set(ids).size === ids.length, "Select each service once.");
export const publicDateSchema = z.string().refine(isCalendarDate, "Enter a valid YYYY-MM-DD date.");
export const publicLocalTimeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Enter a valid HH:mm local time.");
export const publicLocalStartSchema = z.string().refine(
  (value) => localStartPattern.test(value) && isCalendarDate(value.slice(0, 10)),
  "Enter a valid YYYY-MM-DDTHH:mm local start.",
);
export const publicClientEmailSchema = z.string().trim().email().max(254);

export const publicAvailabilityQuerySchema = z.object({
  professionalId: publicRecordIdSchema,
  serviceIds: publicServiceIdsSchema,
  date: publicDateSchema,
});

export const publicAppointmentInputSchema = z.object({
  email: publicClientEmailSchema,
  professionalId: publicRecordIdSchema,
  serviceIds: publicServiceIdsSchema,
  localStart: publicLocalStartSchema,
}).strict();

export const publicClientRegistrationSchema = z.object({
  email: publicClientEmailSchema,
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(7).max(24).refine(
    (value) => value.replace(/\D/g, "").length >= 7,
    "Enter a phone number with at least seven digits.",
  ),
}).strict();
