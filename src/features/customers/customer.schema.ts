import { z } from "zod";

export const consentStateSchema = z.enum(["unknown", "granted", "denied"]);
export const consentMethodSchema = z.enum(["in_person", "phone", "website", "other"]);
export const communicationPreferencesSchema = z.object({
  whatsappService: consentStateSchema,
  whatsappMarketing: consentStateSchema,
  emailMarketing: consentStateSchema,
});

export const customerInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(7).max(24),
  email: z.union([z.string().trim().email().max(254), z.literal("")]).optional(),
  notes: z.string().trim().max(2000).optional(),
  communicationPreferences: communicationPreferencesSchema.partial().optional(),
  consentMethod: consentMethodSchema.optional(),
});

export const customerUpdateSchema = customerInputSchema.partial();

export type CustomerInput = z.infer<typeof customerInputSchema>;
export type CommunicationPreferences = z.infer<typeof communicationPreferencesSchema>;

export function normalizeCustomerSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("en")
    .trim();
}

export function customerSearchTerms(name: string, phone: string) {
  const normalizedName = normalizeCustomerSearch(name);
  const textTerms = normalizedName
    .split(/\s+/)
    .filter(Boolean)
    .flatMap((word) => Array.from({ length: word.length }, (_, index) => word.slice(0, index + 1)));
  const phoneDigits = phone.replace(/\D/g, "");
  const phoneTerms = Array.from(
    { length: phoneDigits.length },
    (_, index) => phoneDigits.slice(0, index + 1),
  );

  return [...new Set([normalizedName, ...textTerms, ...phoneTerms])];
}
