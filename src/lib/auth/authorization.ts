import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import type { SessionUser } from "@/lib/auth/session";
import { tenantIdSchema } from "@/lib/validation/common";

export type WorkspaceRole = "owner" | "staff";

export type AuthorizedWorkspace = {
  tenantId: string;
  role: WorkspaceRole;
};

export async function getWorkspaceMembership(
  user: SessionUser,
  tenantId: string,
): Promise<AuthorizedWorkspace | null> {
  if (!tenantIdSchema.safeParse(tenantId).success) {
    return null;
  }

  const membership = await adminDb
    .doc(`tenants/${tenantId}/members/${user.uid}`)
    .get();

  if (!membership.exists) {
    return null;
  }

  const data = membership.data();
  if (data?.status !== "active" || (data.role !== "owner" && data.role !== "staff")) {
    return null;
  }

  return { tenantId, role: data.role };
}

export async function requireWorkspaceMember(
  user: SessionUser,
  tenantId: string,
): Promise<AuthorizedWorkspace> {
  const membership = await getWorkspaceMembership(user, tenantId);
  if (!membership) {
    throw new Error("You do not have access to this workspace.");
  }
  return membership;
}

export async function requireWorkspaceOwner(
  user: SessionUser,
  tenantId: string,
): Promise<AuthorizedWorkspace> {
  const membership = await requireWorkspaceMember(user, tenantId);
  if (membership.role !== "owner") {
    throw new Error("Only workspace owners can perform this action.");
  }
  return membership;
}

export async function listUserWorkspaces(user: SessionUser) {
  const memberships = await adminDb
    .collection(`users/${user.uid}/memberships`)
    .where("status", "==", "active")
    .get();

  return Promise.all(
    memberships.docs.map(async (membership) => {
      const tenantId = membership.id;
      const [workspace, activeMembership] = await Promise.all([
        adminDb.doc(`tenants/${tenantId}`).get(),
        adminDb.doc(`tenants/${tenantId}/members/${user.uid}`).get(),
      ]);

      if (!workspace.exists || activeMembership.data()?.status !== "active") {
        return null;
      }

      const data = workspace.data();
      return {
        tenantId,
        name: typeof data?.name === "string" ? data.name : "Untitled workspace",
        role: activeMembership.data()?.role as WorkspaceRole,
      };
    }),
  ).then((workspaces) => workspaces.filter((workspace) => workspace !== null));
}

export async function createWorkspace(
  user: SessionUser,
  input: {
    name: string;
    currency: string;
    timeZone: string;
  },
) {
  const tenantRef = adminDb.collection("tenants").doc();
  const memberRef = tenantRef.collection("members").doc(user.uid);
  const userMembershipRef = adminDb.doc(`users/${user.uid}/memberships/${tenantRef.id}`);

  await adminDb.runTransaction(async (transaction) => {
    transaction.create(tenantRef, {
      name: input.name,
      currency: input.currency,
      timeZone: input.timeZone,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    transaction.create(memberRef, {
      userId: user.uid,
      role: "owner" satisfies WorkspaceRole,
      status: "active",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    transaction.create(userMembershipRef, {
      tenantId: tenantRef.id,
      status: "active",
      createdAt: FieldValue.serverTimestamp(),
    });
    transaction.create(tenantRef.collection("settings").doc("general"), {
      currency: input.currency,
      timeZone: input.timeZone,
      operatingHours: {},
      reminderSettings: { enabled: false, intervalsMinutes: [] },
      reactivationIntervalDays: 90,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  return tenantRef.id;
}
