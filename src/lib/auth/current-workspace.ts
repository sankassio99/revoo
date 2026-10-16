import "server-only";

import { cookies } from "next/headers";
import { adminDb } from "@/lib/firebase/admin";
import { getWorkspaceMembership, listUserWorkspaces } from "@/lib/auth/authorization";
import type { SessionUser } from "@/lib/auth/session";

export async function getCurrentWorkspace(user: SessionUser) {
  const cookieStore = await cookies();
  const requestedTenantId = cookieStore.get("revoo_workspace")?.value;
  const available = await listUserWorkspaces(user);
  const tenantId =
    requestedTenantId && available.some((workspace) => workspace.tenantId === requestedTenantId)
      ? requestedTenantId
      : available[0]?.tenantId;

  if (!tenantId) {
    return { workspace: null, workspaces: available };
  }

  const membership = await getWorkspaceMembership(user, tenantId);
  if (!membership) {
    return { workspace: null, workspaces: available };
  }

  const workspaceSnapshot = await adminDb.doc(`tenants/${tenantId}`).get();
  if (!workspaceSnapshot.exists) {
    return { workspace: null, workspaces: available };
  }

  const data = workspaceSnapshot.data();
  return {
    workspace: {
      tenantId,
      name: typeof data?.name === "string" ? data.name : "Untitled workspace",
      currency: typeof data?.currency === "string" ? data.currency : "EUR",
      timeZone: typeof data?.timeZone === "string" ? data.timeZone : "UTC",
      role: membership.role,
    },
    workspaces: available,
  };
}
