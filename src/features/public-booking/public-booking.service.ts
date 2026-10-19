import "server-only";

import { adminDb } from "@/lib/firebase/admin";
import { currencySchema, isRecord, timeZoneSchema } from "@/lib/validation/common";
import { publicTenantIdSchema } from "@/features/public-booking/public-booking.schema";
import { operatingHoursSchema } from "@/features/workspaces/workspace-settings.schema";
import type { WorkspaceSettingsInput } from "@/features/workspaces/workspace-settings.schema";

const weekdayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;

function isOpenNow(
  operatingHours: WorkspaceSettingsInput["operatingHours"],
  timeZone: string,
) {
  const localParts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      hourCycle: "h23",
      minute: "2-digit",
      timeZone,
      weekday: "long",
    }).formatToParts(new Date()).map(({ type, value }) => [type, value]),
  );
  const weekday = weekdayNames.find((day) => day === localParts.weekday?.toLowerCase());
  if (!weekday) return false;

  const hours = operatingHours[weekday];
  if (hours.closed) return false;
  const currentMinute = Number(localParts.hour) * 60 + Number(localParts.minute);
  const openingMinute = Number(hours.open.slice(0, 2)) * 60 + Number(hours.open.slice(3));
  const closingMinute = Number(hours.close.slice(0, 2)) * 60 + Number(hours.close.slice(3));
  return currentMinute >= openingMinute && currentMinute < closingMinute;
}

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

  const [workspace, settings] = await Promise.all([
    adminDb.doc(`tenants/${parsedTenantId.data}`).get(),
    adminDb.doc(`tenants/${parsedTenantId.data}/settings/general`).get(),
  ]);
  if (!workspace.exists) {
    throw new PublicBookingError("Workspace not found.", 404);
  }

  const settingsData = settings.data() ?? {};
  const name: unknown = workspace.get("name");
  const rootTimeZone = timeZoneSchema.safeParse(workspace.get("timeZone"));
  const configuredTimeZone = rootTimeZone.success
    ? rootTimeZone
    : timeZoneSchema.safeParse(settingsData.timeZone);
  if (typeof name !== "string" || !name.trim() || !configuredTimeZone.success) {
    throw new PublicBookingError("Workspace booking is not configured.", 404);
  }

  const currency = currencySchema.safeParse(workspace.get("currency"));
  const settingsCurrency = currencySchema.safeParse(settingsData.currency);
  const parsedHours = operatingHoursSchema.safeParse(settingsData.operatingHours);
  const contact = isRecord(settingsData.contact) ? settingsData.contact : {};
  const address = typeof contact.address === "string" ? contact.address.trim() : "";
  const operatingHours = parsedHours.success ? parsedHours.data : null;

  return {
    name: name.trim(),
    timeZone: configuredTimeZone.data,
    currency: currency.success ? currency.data : settingsCurrency.success ? settingsCurrency.data : "EUR",
    address,
    operatingHours,
    isOpenNow: operatingHours ? isOpenNow(operatingHours, configuredTimeZone.data) : false,
  };
}
