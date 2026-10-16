"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function InvitationAcceptance({
  tenantId,
  token,
}: {
  tenantId: string;
  token: string;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function accept() {
    setError("");
    setBusy(true);
    try {
      const response = await fetch(`/api/workspaces/${encodeURIComponent(tenantId)}/invitations/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Invitation could not be accepted.");
      const active = await fetch("/api/workspaces/active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId }),
      });
      if (!active.ok) {
        throw new Error("Invitation accepted. Sign in again to open the workspace.");
      }
      router.replace("/workspace");
      router.refresh();
    } catch (acceptError) {
      setError(acceptError instanceof Error ? acceptError.message : "Invitation could not be accepted.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page-reveal">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">A place on the team</p>
      <h1 className="mt-3 text-3xl font-medium tracking-[-0.065em] text-ink">You&apos;re invited.</h1>
      <p className="mt-3 text-sm leading-6 text-muted">Accept the workspace invitation with the verified email account it was sent to.</p>
      <button className="mt-7 min-h-11 rounded-full bg-forest px-5 text-xs font-medium text-white disabled:opacity-60" disabled={busy} onClick={() => void accept()} type="button">
        {busy ? "Joining…" : "Accept invitation"}
      </button>
      {error && <p aria-live="assertive" className="mt-4 text-xs leading-5 text-red-700">{error}</p>}
    </div>
  );
}
