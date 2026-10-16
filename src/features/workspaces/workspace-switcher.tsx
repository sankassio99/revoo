"use client";

import { useState } from "react";
import { CaretDown, Check, Storefront } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import type { WorkspaceRole } from "@/lib/auth/authorization";

type WorkspaceOption = {
  tenantId: string;
  name: string;
  role: WorkspaceRole;
};

export function WorkspaceSwitcher({
  workspaces,
  activeTenantId,
}: {
  workspaces: WorkspaceOption[];
  activeTenantId: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const active = workspaces.find((workspace) => workspace.tenantId === activeTenantId);

  async function choose(tenantId: string) {
    setBusyId(tenantId);
    setError("");
    try {
      const response = await fetch("/api/workspaces/active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId }),
      });
      if (!response.ok) {
        throw new Error("That workspace is no longer available to this account.");
      }
      setOpen(false);
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Workspace could not be changed.");
    } finally {
      setBusyId(null);
    }
  }

  if (workspaces.length < 2) {
    return (
      <div className="flex min-w-0 items-center gap-3 rounded-xl px-3 py-2.5">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/10 text-[#d0a186]">
          <Storefront size={17} />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-xs font-medium text-white">
            {active?.name ?? "Your workspace"}
          </span>
          <span className="mt-1 block text-[10px] capitalize text-white/50">
            {active?.role ?? "Workspace"}
          </span>
        </span>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex w-full min-w-0 items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-white/8"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/10 text-[#d0a186]">
          <Storefront size={17} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-medium text-white">{active?.name}</span>
          <span className="mt-1 block text-[10px] capitalize text-white/50">{active?.role}</span>
        </span>
        <CaretDown className="shrink-0 text-white/45" size={14} />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[2] rounded-xl border border-white/10 bg-[#20443a] p-1.5 shadow-[0_18px_36px_-18px_rgba(5,20,15,0.65)]">
          <div role="listbox">
            {workspaces.map((workspace) => (
              <button
                aria-selected={workspace.tenantId === activeTenantId}
                className="flex min-h-10 w-full items-center gap-2 rounded-lg px-2.5 text-left text-xs text-white/80 transition-colors hover:bg-white/8 disabled:opacity-60"
                disabled={busyId !== null}
                key={workspace.tenantId}
                onClick={() => void choose(workspace.tenantId)}
                role="option"
                type="button"
              >
                <span className="min-w-0 flex-1 truncate">{workspace.name}</span>
                {workspace.tenantId === activeTenantId && <Check size={14} />}
              </button>
            ))}
          </div>
          {error && (
            <p aria-live="assertive" className="mt-2 rounded-lg bg-red-950/70 px-3 py-2 text-[11px] text-white">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
