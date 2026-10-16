import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import type { SessionUser } from "@/lib/auth/session";
import {
  requireWorkspaceOwner,
} from "@/lib/auth/authorization";
import {
  invitationActionSchema,
  invitationInputSchema,
} from "@/features/workspaces/invitation.schema";
import { tenantIdSchema } from "@/lib/validation/common";

const expirationMilliseconds = 7 * 24 * 60 * 60 * 1000;

function normalizeEmail(email: string) {
  return email.trim().toLocaleLowerCase("en");
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function listInvitations(user: SessionUser, tenantId: string) {
  await requireWorkspaceOwner(user, tenantId);
  const invitations = await adminDb
    .collection(`tenants/${tenantId}/invitations`)
    .orderBy("createdAt", "desc")
    .limit(100)
    .get();
  return invitations.docs.map((invitation) => {
    const data = invitation.data();
    const expired =
      data.status === "pending" &&
      data.expiresAt instanceof Timestamp &&
      data.expiresAt.toMillis() <= Date.now();
    return {
      id: invitation.id,
      email: String(data.emailNormalized ?? ""),
      status: expired ? "expired" : String(data.status ?? "pending"),
      expiresAt: data.expiresAt instanceof Timestamp ? data.expiresAt.toDate().toISOString() : null,
    };
  });
}

export async function listWorkspaceMembers(user: SessionUser, tenantId: string) {
  await requireWorkspaceOwner(user, tenantId);
  const members = await adminDb
    .collection(`tenants/${tenantId}/members`)
    .orderBy("createdAt", "desc")
    .get();
  const profiles =
    members.docs.length > 0
      ? await adminDb.getAll(...members.docs.map((member) => adminDb.doc(`users/${member.id}`)))
      : [];
  const profilesById = new Map(profiles.map((profile) => [profile.id, profile.data()]));
  return members.docs.map((member) => {
    const profile = profilesById.get(member.id);
    const role: "owner" | "staff" =
      member.get("role") === "owner" ? "owner" : "staff";
    const status: "active" | "revoked" =
      member.get("status") === "active" ? "active" : "revoked";
    return {
      userId: member.id,
      displayName: typeof profile?.displayName === "string" ? profile.displayName : "",
      email: typeof profile?.email === "string" ? profile.email : "",
      role,
      status,
    };
  });
}

export async function createInvitation(
  user: SessionUser,
  tenantId: string,
  input: unknown,
) {
  await requireWorkspaceOwner(user, tenantId);
  const parsed = invitationInputSchema.safeParse(input);
  if (!parsed.success) throw new Error("Enter a valid email address for the invite.");

  const token = randomBytes(32).toString("base64url");
  const invitationId = hashToken(token);
  const invitationRef = adminDb.doc(
    `tenants/${tenantId}/invitations/${invitationId}`,
  );
  const expiresAt = Timestamp.fromMillis(Date.now() + expirationMilliseconds);
  await invitationRef.create({
    emailNormalized: normalizeEmail(parsed.data.email),
    role: "staff",
    status: "pending",
    expiresAt,
    createdBy: user.uid,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return { invitationId, token, expiresAt: expiresAt.toDate().toISOString() };
}

export async function revokeInvitation(
  user: SessionUser,
  tenantId: string,
  input: unknown,
) {
  await requireWorkspaceOwner(user, tenantId);
  const parsed = invitationActionSchema.safeParse(input);
  if (!parsed.success) throw new Error("Choose a valid invitation to revoke.");
  const invitation = adminDb.doc(
    `tenants/${tenantId}/invitations/${parsed.data.invitationId}`,
  );
  await adminDb.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(invitation);
    if (!snapshot.exists) throw new Error("Invitation not found.");
    if (snapshot.get("status") !== "pending") {
      throw new Error("Only pending invitations can be revoked.");
    }
    transaction.update(invitation, {
      status: "revoked",
      revokedBy: user.uid,
      revokedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
}

export async function acceptInvitation(
  user: SessionUser,
  tenantId: string,
  token: string,
) {
  if (!user.email || !user.emailVerified) {
    throw new Error("Verify your account email before accepting this invitation.");
  }
  if (!tenantIdSchema.safeParse(tenantId).success) {
    throw new Error("This invitation link is invalid or expired.");
  }
  if (!/^[A-Za-z0-9_-]{40,60}$/.test(token)) {
    throw new Error("This invitation link is invalid or expired.");
  }

  const invitationRef = adminDb.doc(
    `tenants/${tenantId}/invitations/${hashToken(token)}`,
  );
  const memberRef = adminDb.doc(`tenants/${tenantId}/members/${user.uid}`);
  const userMembershipRef = adminDb.doc(`users/${user.uid}/memberships/${tenantId}`);
  const email = user.email;

  return adminDb.runTransaction(async (transaction) => {
    const [invitation, workspace, member] = await Promise.all([
      transaction.get(invitationRef),
      transaction.get(adminDb.doc(`tenants/${tenantId}`)),
      transaction.get(memberRef),
    ]);
    if (!invitation.exists || !workspace.exists) {
      throw new Error("This invitation link is invalid or expired.");
    }
    if (invitation.get("status") !== "pending") {
      throw new Error("This invitation is no longer available.");
    }
    const expiresAt = invitation.get("expiresAt");
    if (!(expiresAt instanceof Timestamp) || expiresAt.toMillis() <= Date.now()) {
      transaction.update(invitationRef, {
        status: "expired",
        updatedAt: FieldValue.serverTimestamp(),
      });
      return { accepted: false, reason: "This invitation has expired." };
    }
    if (normalizeEmail(email) !== invitation.get("emailNormalized")) {
      throw new Error("Sign in with the email address this invitation was sent to.");
    }
    if (member.exists && member.get("status") === "active") {
      throw new Error("You already belong to this workspace.");
    }

    transaction.set(memberRef, {
      userId: user.uid,
      role: "staff",
      status: "active",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    transaction.set(userMembershipRef, {
      tenantId,
      status: "active",
      createdAt: FieldValue.serverTimestamp(),
    });
    transaction.update(invitationRef, {
      status: "accepted",
      acceptedBy: user.uid,
      acceptedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { accepted: true };
  });
}

export async function revokeMembership(
  owner: SessionUser,
  tenantId: string,
  memberUserId: string,
) {
  await requireWorkspaceOwner(owner, tenantId);
  if (!memberUserId || memberUserId === owner.uid) {
    throw new Error("The workspace owner cannot revoke their own membership.");
  }
  const member = adminDb.doc(`tenants/${tenantId}/members/${memberUserId}`);
  const userMembership = adminDb.doc(`users/${memberUserId}/memberships/${tenantId}`);
  await adminDb.runTransaction(async (transaction) => {
    const [snapshot, userSnapshot] = await Promise.all([
      transaction.get(member),
      transaction.get(userMembership),
    ]);
    if (!snapshot.exists || snapshot.get("status") !== "active") {
      throw new Error("Active workspace membership not found.");
    }
    transaction.update(member, {
      status: "revoked",
      revokedBy: owner.uid,
      revokedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    if (userSnapshot.exists) transaction.update(userMembership, { status: "revoked" });
  });
}
