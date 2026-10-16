import Link from "next/link";
import { Plus, Sparkle } from "@phosphor-icons/react/dist/ssr";
import { WorkspaceSwitcher } from "@/features/workspaces/workspace-switcher";
import { CreateWorkspaceButton } from "@/features/workspaces/create-workspace-button";
import { SidebarNav } from "@/features/navigation/sidebar-nav";
import { SignOutButton } from "@/features/auth/sign-out-button";
import type { WorkspaceRole } from "@/lib/auth/authorization";
import { MagneticLink } from "@/features/navigation/magnetic-link";
import { MobileNav } from "@/features/navigation/mobile-nav";

export type WorkspaceSummary = {
  tenantId: string;
  name: string;
  role: WorkspaceRole;
};

export function AppFrame({
  children,
  user,
  workspaces,
  activeTenantId,
}: {
  children: React.ReactNode;
  user: { email: string | null; displayName: string | null };
  workspaces: WorkspaceSummary[];
  activeTenantId: string | null;
}) {
  const active = workspaces.find((workspace) => workspace.tenantId === activeTenantId);
  const initials = (user.displayName ?? user.email ?? "R")
    .split(/[ .@_-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <div className="min-h-[100dvh] bg-paper">
      <aside className="fixed inset-y-0 left-0 z-[2] hidden w-[248px] flex-col bg-forest px-4 py-5 lg:flex">
        <Link className="flex items-center gap-3 px-3 pb-8 pt-1" href="/" aria-label="Revoo home">
          <span className="grid size-9 place-items-center rounded-full border border-white/15 bg-white/10 text-white">
            <Sparkle size={16} weight="fill" />
          </span>
          <span className="text-[19px] font-semibold tracking-[-0.06em] text-white">revoo</span>
        </Link>

        <div className="mb-7">
          <WorkspaceSwitcher activeTenantId={activeTenantId} workspaces={workspaces} />
          {workspaces.length > 0 && (
            <div className="mt-2 px-3">
              <CreateWorkspaceButton />
            </div>
          )}
        </div>

        <p className="mb-3 px-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-white/35">
          Workspace
        </p>
        <SidebarNav />

        <div className="mt-auto border-t border-white/12 pt-4">
          <div className="mb-3 flex items-center gap-3 px-2 py-2">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#d7b49d] text-xs font-semibold text-forest">
              {initials || "R"}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-medium text-white">
                {user.displayName ?? "Your account"}
              </span>
              <span className="mt-1 block truncate text-[10px] text-white/50">
                {active?.role ?? user.email ?? "Account"}
              </span>
            </span>
          </div>
          <SignOutButton />
        </div>
      </aside>

      <div className="min-h-[100dvh] lg:pl-[248px]">
        <header className="sticky top-0 z-[1] border-b border-line/80 bg-paper/90 px-4 py-3 backdrop-blur-xl sm:px-7 lg:px-10">
          <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3 lg:hidden">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-forest text-white">
                <Sparkle size={14} weight="fill" />
              </span>
              <span className="truncate text-sm font-semibold tracking-[-0.05em] text-forest">
                {active?.name ?? "Your workspace"}
              </span>
            </div>
            <div className="hidden text-xs text-muted lg:block">
              {active?.name ?? "Your workspace"}
              <span className="mx-2 text-line">/</span>
              {active?.role === "owner" ? "Owner workspace" : "Studio"}
            </div>
            <div className="flex items-center gap-2">
              {workspaces.length > 0 && (
                <div className="lg:hidden">
                  <WorkspaceSwitcher activeTenantId={activeTenantId} workspaces={workspaces} />
                </div>
              )}
              <MagneticLink
                className="group inline-flex min-h-10 items-center gap-2 rounded-full bg-forest px-4 text-xs font-medium text-white transition-colors hover:bg-[#20483b] active:scale-[0.98]"
                href="/workspace/appointments?new=1"
              >
                <Plus size={15} weight="bold" />
                <span className="hidden sm:inline">New appointment</span>
                <span className="sm:hidden">Book</span>
              </MagneticLink>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1440px] px-4 pb-24 pt-7 sm:px-7 sm:pt-9 lg:px-10 lg:pb-10">
          {children}
        </main>
      </div>

      <MobileNav />
    </div>
  );
}
