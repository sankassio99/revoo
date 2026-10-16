import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import type { SessionUser } from "@/lib/auth/session";
import {
  requireWorkspaceMember,
  requireWorkspaceOwner,
} from "@/lib/auth/authorization";
import {
  workspaceSettingsInputSchema,
  type WorkspaceSettingsInput,
} from "@/features/workspaces/workspace-settings.schema";
import { currencySchema, timeZoneSchema } from "@/lib/validation/common";

const weekdayNames = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

export async function getWorkspaceSettings(user: SessionUser, tenantId: string) {
  await requireWorkspaceMember(user, tenantId);
  const [workspace, settings] = await Promise.all([
    adminDb.doc(`tenants/${tenantId}`).get(),
    adminDb.doc(`tenants/${tenantId}/settings/general`).get(),
  ]);
  if (!workspace.exists || !settings.exists) {
    throw new Error("Workspace settings are incomplete.");
  }

  const root = workspace.data() ?? {};
  const data = settings.data() ?? {};
  const parsedCurrency = currencySchema.safeParse(root.currency);
  const parsedTimeZone = timeZoneSchema.safeParse(root.timeZone);
  const hours = data.operatingHours && typeof data.operatingHours === "object"
    ? data.operatingHours
    : {};
  return {
    name: String(root.name ?? ""),
    currency: parsedCurrency.success ? parsedCurrency.data : "EUR",
    timeZone: parsedTimeZone.success ? parsedTimeZone.data : "UTC",
    contact: {
      email: typeof data.contact?.email === "string" ? data.contact.email : "",
      phone: typeof data.contact?.phone === "string" ? data.contact.phone : "",
      address: typeof data.contact?.address === "string" ? data.contact.address : "",
    },
    operatingHours: Object.fromEntries(
      weekdayNames.map((day) => {
        const dayHours = hours[day];
        return [
          day,
          {
            closed: dayHours?.closed !== false,
            open: typeof dayHours?.open === "string" ? dayHours.open : "09:00",
            close: typeof dayHours?.close === "string" ? dayHours.close : "17:00",
          },
        ];
      }),
    ) as WorkspaceSettingsInput["operatingHours"],
    reminderSettings: {
      enabled: data.reminderSettings?.enabled === true,
      intervalsMinutes: Array.isArray(data.reminderSettings?.intervalsMinutes)
        ? data.reminderSettings.intervalsMinutes.filter(
            (interval: unknown): interval is number =>
              typeof interval === "number" &&
              Number.isSafeInteger(interval) &&
              interval > 0,
          )
        : [],
    },
    reactivationIntervalDays:
      Number.isSafeInteger(data.reactivationIntervalDays) && data.reactivationIntervalDays > 0
        ? data.reactivationIntervalDays
        : 90,
  };
}

export async function updateWorkspaceSettings(
  user: SessionUser,
  tenantId: string,
  input: unknown,
) {
  await requireWorkspaceOwner(user, tenantId);
  const parsed = workspaceSettingsInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error("Review the business details, time zone, currency, hours, and intervals.");
  }
  const settings = adminDb.doc(`tenants/${tenantId}/settings/general`);
  const workspace = adminDb.doc(`tenants/${tenantId}`);

  await adminDb.runTransaction(async (transaction) => {
    const [workspaceSnapshot, settingsSnapshot] = await Promise.all([
      transaction.get(workspace),
      transaction.get(settings),
    ]);
    if (!workspaceSnapshot.exists || !settingsSnapshot.exists) {
      throw new Error("Workspace settings are incomplete.");
    }
    transaction.update(workspace, {
      name: parsed.data.name,
      currency: parsed.data.currency,
      timeZone: parsed.data.timeZone,
      updatedAt: FieldValue.serverTimestamp(),
    });
    transaction.update(settings, {
      currency: parsed.data.currency,
      timeZone: parsed.data.timeZone,
      contact: parsed.data.contact,
      operatingHours: parsed.data.operatingHours,
      reminderSettings: parsed.data.reminderSettings,
      reactivationIntervalDays: parsed.data.reactivationIntervalDays,
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
}
