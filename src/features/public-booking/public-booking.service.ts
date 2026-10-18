import "server-only";

import { adminDb } from "@/lib/firebase/admin";
import { timeZoneSchema } from "@/lib/validation/common";
import { publicTenantIdSchema } from "@/features/public-booking/public-booking.schema";

export class PublicBookingError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "PublicBookingError";
  }
}

export async function getPublicBookingWorkspace(tenantId: string) {
  const parsedTenantId = publicTenantIdSchema.safeParse(tenantId);
  if (!parsedTenantId.success) {
    throw new PublicBookingError("Workspace not found.", 404);
  }

  const workspace = await adminDb.doc(`tenants/${parsedTenantId.data}`).get();
  if (!workspace.exists) {
    throw new PublicBookingError("Workspace not found.", 404);
  }

  const name: unknown = workspace.get("name");
  const rootTimeZone = timeZoneSchema.safeParse(workspace.get("timeZone"));
  const configuredTimeZone = rootTimeZone.success
    ? rootTimeZone
    : timeZoneSchema.safeParse((await adminDb.doc(`tenants/${parsedTenantId.data}/settings/general`).get()).get("timeZone"));
  if (typeof name !== "string" || !name.trim() || !configuredTimeZone.success) {
    throw new PublicBookingError("Workspace booking is not configured.", 404);
  }

  return { name: name.trim(), timeZone: configuredTimeZone.data };
}
