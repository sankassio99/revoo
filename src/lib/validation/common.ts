import { z } from "zod";

export const tenantIdSchema = z.string().regex(/^[A-Za-z0-9_-]{20,32}$/);
export const currencySchema = z.enum(["EUR", "GBP", "USD"]);
export const timeZoneSchema = z.string().refine((value) => {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}, "Enter a valid IANA time zone.");

export const workspaceInputSchema = z.object({
  name: z.string().trim().min(2).max(80),
  currency: currencySchema,
  timeZone: timeZoneSchema,
});

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
