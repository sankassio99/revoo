import { z } from "zod";

export const invitationInputSchema = z.object({
  email: z.string().trim().email().max(254),
});

export const invitationActionSchema = z.object({
  action: z.literal("revoke"),
  invitationId: z.string().regex(/^[a-f0-9]{64}$/),
});
