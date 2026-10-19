import type { WorkspaceSettingsInput } from "@/features/workspaces/workspace-settings.schema";

export type PublicBookingOptions = {
  workspace: {
    name: string;
    timeZone: string;
    currency: WorkspaceSettingsInput["currency"];
    address: string;
    operatingHours: WorkspaceSettingsInput["operatingHours"] | null;
    isOpenNow: boolean;
  };
  services: {
    id: string;
    name: string;
    durationMinutes: number;
    priceMinorUnits: number;
  }[];
  professionals: {
    id: string;
    name: string;
    serviceIds: string[];
  }[];
};
