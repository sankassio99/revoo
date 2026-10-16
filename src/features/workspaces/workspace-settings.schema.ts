import { z } from "zod";
import { currencySchema, timeZoneSchema } from "@/lib/validation/common";

const dayHoursSchema = z.object({
  closed: z.boolean(),
  open: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  close: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
}).superRefine((value, context) => {
  if (!value.closed && value.open >= value.close) {
    context.addIssue({
      code: "custom",
      path: ["close"],
      message: "Closing time must be later than opening time.",
    });
  }
});

export const operatingHoursSchema = z.object({
  sunday: dayHoursSchema,
  monday: dayHoursSchema,
  tuesday: dayHoursSchema,
  wednesday: dayHoursSchema,
  thursday: dayHoursSchema,
  friday: dayHoursSchema,
  saturday: dayHoursSchema,
});

export const workspaceSettingsInputSchema = z.object({
  name: z.string().trim().min(2).max(80),
  currency: currencySchema,
  timeZone: timeZoneSchema,
  contact: z.object({
    email: z.union([z.string().trim().email().max(254), z.literal("")]),
    phone: z.string().trim().max(32),
    address: z.string().trim().max(200),
  }),
  operatingHours: operatingHoursSchema,
  reminderSettings: z.object({
    enabled: z.boolean(),
    intervalsMinutes: z.array(z.number().int().positive().max(525600)).max(10),
  }),
  reactivationIntervalDays: z.number().int().positive().max(3650),
});

export type WorkspaceSettingsInput = z.infer<typeof workspaceSettingsInputSchema>;
