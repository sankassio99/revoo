import { z } from "zod";

const serviceIdSchema = z.string().min(1).max(128);

export const serviceInputSchema = z.object({
  name: z.string().trim().min(2).max(100),
  durationMinutes: z.number().int().positive().safe(),
  priceMinorUnits: z.number().int().nonnegative().safe(),
});

export const professionalInputSchema = z.object({
  name: z.string().trim().min(2).max(100),
  serviceIds: z.array(serviceIdSchema).min(1).max(100),
});

export const catalogStatusSchema = z.enum(["active", "inactive"]);

export const serviceUpdateSchema = serviceInputSchema
  .partial()
  .extend({ status: catalogStatusSchema.optional() });

export const professionalUpdateSchema = professionalInputSchema
  .partial()
  .extend({ status: catalogStatusSchema.optional() });

export type ServiceInput = z.infer<typeof serviceInputSchema>;
export type ProfessionalInput = z.infer<typeof professionalInputSchema>;

