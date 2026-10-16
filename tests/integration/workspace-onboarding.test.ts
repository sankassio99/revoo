import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { createWorkspace } from "@/lib/auth/authorization";
import {
  acceptInvitation,
  createInvitation,
  revokeInvitation,
} from "@/features/workspaces/invitation.service";
import type { SessionUser } from "@/lib/auth/session";

const user: SessionUser = {
  uid: "workspace-onboarding-owner",
  email: "owner@example.test",
  displayName: "Workspace Owner",
  emailVerified: true,
};

describe("workspace bootstrap", () => {
  beforeEach(async () => {
    const memberships = await adminDb
      .collection(`users/${user.uid}/memberships`)
      .get();
    const batch = adminDb.batch();
    memberships.docs.forEach((membership) => batch.delete(membership.ref));
    await batch.commit();
  });

  afterAll(async () => {
    await adminDb.terminate();
  });

  it("creates the workspace, owner membership, user membership, and settings together", async () => {
    const tenantId = await createWorkspace(user, {
      name: "Studio",
      currency: "EUR",
      timeZone: "Europe/Berlin",
    });

    const [workspace, member, userMembership, settings] = await Promise.all([
      adminDb.doc(`tenants/${tenantId}`).get(),
      adminDb.doc(`tenants/${tenantId}/members/${user.uid}`).get(),
      adminDb.doc(`users/${user.uid}/memberships/${tenantId}`).get(),
      adminDb.doc(`tenants/${tenantId}/settings/general`).get(),
    ]);

    expect(workspace.data()).toMatchObject({
      name: "Studio",
      currency: "EUR",
      timeZone: "Europe/Berlin",
    });
    expect(member.data()).toMatchObject({ role: "owner", status: "active" });
    expect(userMembership.data()).toMatchObject({ tenantId, status: "active" });
    expect(settings.data()).toMatchObject({
      reminderSettings: { enabled: false, intervalsMinutes: [] },
      reactivationIntervalDays: 90,
    });

    it("accepts an invitation only for its verified intended email", async () => {
      const tenantId = await createWorkspace(user, {
        name: "Invite studio",
        currency: "EUR",
        timeZone: "Europe/Berlin",
      });
      const invitation = await createInvitation(user, tenantId, {
        email: "staff@example.test",
      });
      const invitee: SessionUser = {
        uid: "workspace-onboarding-staff",
        email: "staff@example.test",
        displayName: "Staff",
        emailVerified: true,
      };

      await expect(acceptInvitation(
        { ...invitee, email: "other@example.test" },
        tenantId,
        invitation.token,
      )).rejects.toThrow(/email address/);
      await expect(acceptInvitation(invitee, tenantId, invitation.token)).resolves.toEqual({
        accepted: true,
      });
      const membership = await adminDb.doc(`tenants/${tenantId}/members/${invitee.uid}`).get();
      expect(membership.data()).toMatchObject({ role: "staff", status: "active" });
    });

    it("rejects revoked invitations and expires invitations atomically", async () => {
      const tenantId = await createWorkspace(user, {
        name: "Invitation lifecycle",
        currency: "EUR",
        timeZone: "UTC",
      });
      const revoked = await createInvitation(user, tenantId, { email: "revoked@example.test" });
      await revokeInvitation(user, tenantId, {
        action: "revoke",
        invitationId: revoked.invitationId,
      });
      const revokedInvitee: SessionUser = {
        uid: "revoked-invitee",
        email: "revoked@example.test",
        displayName: null,
        emailVerified: true,
      };
      await expect(acceptInvitation(revokedInvitee, tenantId, revoked.token)).rejects.toThrow(
        /no longer available/,
      );

      const expired = await createInvitation(user, tenantId, { email: "expired@example.test" });
      await adminDb
        .doc(`tenants/${tenantId}/invitations/${expired.invitationId}`)
        .update({ expiresAt: Timestamp.fromMillis(Date.now() - 1000) });
      const expiredInvitee: SessionUser = {
        uid: "expired-invitee",
        email: "expired@example.test",
        displayName: null,
        emailVerified: true,
      };
      await expect(acceptInvitation(expiredInvitee, tenantId, expired.token)).resolves.toEqual({
        accepted: false,
        reason: "This invitation has expired.",
      });
      const membership = await adminDb.doc(`tenants/${tenantId}/members/${expiredInvitee.uid}`).get();
      expect(membership.exists).toBe(false);
    });
  });
});
