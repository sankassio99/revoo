"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/features/i18n/language-provider";
import { translate } from "@/lib/i18n/messages";

type Invitation = {
  id: string;
  email: string;
  status: string;
  expiresAt: string | null;
};

type TeamMember = {
  userId: string;
  displayName: string;
  email: string;
  role: "owner" | "staff";
  status: "active" | "revoked";
};

export function InvitationManager({
  tenantId,
  invitations,
  members,
}: {
  tenantId: string;
  invitations: Invitation[];
  members: TeamMember[];
}) {
  const router = useRouter();
  const { locale } = useLanguage();
  const [email, setEmail] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setInviteUrl("");
    setBusy(true);
    try {
      const response = await fetch(`/api/workspaces/${tenantId}/invitations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = (await response.json()) as { token?: string; error?: string };
      if (!response.ok || !result.token) {
        throw new Error(translate(locale, result.error ?? "Invitation could not be created."));
      }
      setInviteUrl(`${window.location.origin}/accept-invitation?tenantId=${encodeURIComponent(tenantId)}&token=${encodeURIComponent(result.token)}`);
      setEmail("");
      setMessage(translate(locale, "Invitation created. Share this one-time link with the invited person."));
      router.refresh();
    } catch (createError) {
      setError(createError instanceof Error ? translate(locale, createError.message) : translate(locale, "Invitation could not be created."));
    } finally {
      setBusy(false);
    }
  }

  async function revoke(invitationId: string) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/workspaces/${tenantId}/invitations`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revoke", invitationId }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(translate(locale, result.error ?? "Invitation could not be revoked."));
      setMessage(translate(locale, "Invitation revoked."));
      router.refresh();
    } catch (revokeError) {
      setError(revokeError instanceof Error ? translate(locale, revokeError.message) : translate(locale, "Invitation could not be revoked."));
    } finally {
      setBusy(false);
    }
  }

  async function revokeMember(userId: string) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        `/api/workspaces/${tenantId}/members?userId=${encodeURIComponent(userId)}`,
        { method: "DELETE" },
      );
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(translate(locale, result.error ?? "Team member access could not be revoked."));
      setMessage(translate(locale, "Team member access revoked."));
      router.refresh();
    } catch (revokeError) {
      setError(revokeError instanceof Error ? translate(locale, revokeError.message) : translate(locale, "Team member access could not be revoked."));
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setMessage(translate(locale, "Invitation link copied."));
    } catch {
      setMessage(translate(locale, "Copy the invitation link from the field below."));
    }
  }

  return (
    <div className="grid gap-9 lg:grid-cols-[0.8fr_1.2fr]">
      <section aria-labelledby="invite-heading">
        <h2 className="text-sm font-medium text-ink" id="invite-heading">{translate(locale, "Invite a staff member")}</h2>
        <p className="mt-1 text-xs leading-5 text-muted">{translate(locale, "The invitation expires after seven days and can only be accepted by the matching verified email account.")}</p>
        <form className="mt-5 grid gap-3" onSubmit={create}>
          <label className="grid gap-2 text-xs font-medium text-ink">
            {translate(locale, "Team member's email")}
            <input autoComplete="email" className="min-h-11 rounded-xl border border-line bg-white px-3.5 text-sm outline-none focus:border-forest" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
          </label>
          <button className="min-h-11 w-fit rounded-full bg-forest px-5 text-xs font-medium text-white disabled:opacity-60" disabled={busy} type="submit">{translate(locale, busy ? "Working…" : "Create invitation")}</button>
        </form>
        {inviteUrl && (
          <div className="mt-4 grid gap-2 rounded-xl bg-[#f0eee7] p-3">
            <label className="grid gap-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
              {translate(locale, "One-time invitation link")}
              <input className="min-h-10 w-full rounded-lg border border-line bg-white px-3 text-xs text-ink" onFocus={(event) => event.currentTarget.select()} readOnly value={inviteUrl} />
            </label>
            <button className="w-fit text-xs font-medium text-forest hover:underline" onClick={() => void copyLink()} type="button">{translate(locale, "Copy link")}</button>
          </div>
        )}
      </section>

      <section aria-labelledby="invitations-heading">
        <h2 className="text-sm font-medium text-ink" id="invitations-heading">{translate(locale, "Recent invitations")}</h2>
        {invitations.length ? (
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {invitations.map((invitation) => (
              <li className="flex flex-wrap items-center gap-3 py-4" key={invitation.id}>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{invitation.email}</p>
                  <p className="mt-1 text-[11px] capitalize text-muted">
                    {translate(locale, invitation.status)}{invitation.expiresAt && invitation.status === "pending" ? ` · ${translate(locale, "expires")} ${new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(invitation.expiresAt))}` : ""}
                  </p>
                </div>
                {invitation.status === "pending" && (
                  <button className="text-xs font-medium text-muted hover:text-red-700 disabled:opacity-60" disabled={busy} onClick={() => void revoke(invitation.id)} type="button">{translate(locale, "Revoke")}</button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 border-y border-line py-7 text-xs text-muted">{translate(locale, "No invitations have been created for this workspace.")}</p>
        )}
      </section>
      <section aria-labelledby="members-heading" className="lg:col-span-2">
        <h2 className="text-sm font-medium text-ink" id="members-heading">{translate(locale, "Workspace members")}</h2>
        <ul className="mt-4 divide-y divide-line border-y border-line">
          {members.map((member) => (
            <li className="flex flex-wrap items-center gap-3 py-4" key={member.userId}>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">
                  {member.displayName || member.email || translate(locale, "Team member")}
                </p>
                <p className="mt-1 text-[11px] capitalize text-muted">{translate(locale, member.role)} · {translate(locale, member.status)}</p>
              </div>
              {member.role === "staff" && member.status === "active" && (
                <button className="text-xs font-medium text-muted hover:text-red-700 disabled:opacity-60" disabled={busy} onClick={() => void revokeMember(member.userId)} type="button">{translate(locale, "Revoke access")}</button>
              )}
            </li>
          ))}
          {!members.length && <li className="py-5 text-xs text-muted">{translate(locale, "No team members yet.")}</li>}
        </ul>
      </section>
      {(error || message) && <p aria-live={error ? "assertive" : "polite"} className={`lg:col-span-2 text-xs ${error ? "text-red-700" : "text-forest"}`}>{error || message}</p>}
    </div>
  );
}
