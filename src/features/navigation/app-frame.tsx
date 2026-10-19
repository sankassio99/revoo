import Link from "next/link";
import { Plus, Sparkle } from "@phosphor-icons/react/dist/ssr";
import { WorkspaceSwitcher } from "@/features/workspaces/workspace-switcher";
import { CreateWorkspaceButton } from "@/features/workspaces/create-workspace-button";
import { SidebarNav } from "@/features/navigation/sidebar-nav";
import { SignOutButton } from "@/features/auth/sign-out-button";
import type { WorkspaceRole } from "@/lib/auth/authorization";
import { MagneticLink } from "@/features/navigation/magnetic-link";
import { MobileNav } from "@/features/navigation/mobile-nav";
import { WorkspaceBottomNav } from "@/features/navigation/workspace-bottom-nav";
import { IconCalendar, IconChartBar, IconHome, IconSettings, IconUsers } from "@tabler/icons-react";
import { translate } from "@/lib/i18n/messages";
import { getRequestLocale } from "@/lib/i18n/server";
import { AppFrameTopbar } from "@/features/navigation/app-frame-topbar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";

export type WorkspaceSummary = {
  tenantId: string;
  name: string;
  role: WorkspaceRole;
};

export async function AppFrame({
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
  const locale = await getRequestLocale();
  const active = workspaces.find((workspace) => workspace.tenantId === activeTenantId);
  const initials = (user.displayName ?? user.email ?? "R")
    .split(/[ .@_-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  const sidebarStyle: React.CSSProperties & { "--sidebar-width": string } = {
    "--sidebar-width": "248px",
  };

  return (
    <SidebarProvider className="min-h-[100dvh] bg-paper" style={sidebarStyle}>
      <Sidebar className="border-r-0 bg-forest">
        <SidebarHeader className="px-4 pb-3 pt-5">
          <Link className="flex items-center gap-3 px-2 pb-5 pt-1" href="/" aria-label={translate(locale, "Revoo home")}>
            <span className="grid size-9 place-items-center rounded-full border border-white/15 bg-white/10 text-white">
              <Sparkle size={16} weight="fill" />
            </span>
            <span className="text-[19px] font-semibold tracking-[-0.06em] text-white">revoo</span>
          </Link>

          <WorkspaceSwitcher activeTenantId={activeTenantId} workspaces={workspaces} />
          {workspaces.length > 0 && (
            <div className="mt-2 px-2">
              <CreateWorkspaceButton />
            </div>
          )}
        </SidebarHeader>

        <SidebarContent>
          <SidebarNav tenantId={activeTenantId} />
        </SidebarContent>

        <SidebarFooter className="border-t border-white/12 px-4 pb-4 pt-3">
          <div className="flex items-center gap-3 px-2 py-2">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#d7b49d] text-xs font-semibold text-forest">
              {initials || "R"}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-medium text-white">
                {user.displayName ?? translate(locale, "Your account")}
              </span>
              <span className="mt-1 block truncate text-[10px] text-white/50">
                {active?.role ?? user.email ?? translate(locale, "Account")}
              </span>
            </span>
          </div>
          <SignOutButton />
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="min-h-[100dvh] bg-paper">
        <AppFrameTopbar>
          <header className="sticky top-0 z-[1] border-b border-line/80 bg-paper/90 px-4 py-3 backdrop-blur-xl sm:px-7 lg:px-10">
            <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2 md:hidden">
                <MobileNav />
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-forest text-white">
                  <Sparkle size={14} weight="fill" />
                </span>
                <span className="truncate text-sm font-semibold tracking-[-0.05em] text-forest">
                  {active?.name ?? translate(locale, "Your workspace")}
                </span>
              </div>
              <div className="hidden text-xs text-muted md:block">
                {active?.name ?? translate(locale, "Your workspace")}
                <span className="mx-2 text-line">/</span>
                {translate(locale, active?.role === "owner" ? "Owner workspace" : "Studio")}
              </div>
              <div className="flex items-center gap-2">
                <MagneticLink
                  className="group inline-flex min-h-10 items-center gap-2 rounded-full bg-forest px-4 text-xs font-medium text-white transition-colors hover:bg-[#20483b] active:scale-[0.98]"
                  href="/workspace/appointments?new=1"
                >
                  <Plus size={15} weight="bold" />
                  <span className="hidden sm:inline">{translate(locale, "New appointment")}</span>
                  <span className="sm:hidden">{translate(locale, "Book")}</span>
                </MagneticLink>
              </div>
            </div>
          </header>
        </AppFrameTopbar>

        <div className="mx-auto w-full max-w-[1440px] px-4 pb-28 pt-7 sm:px-7 sm:pt-9 md:pb-10 lg:px-10">
          {children}
        </div>

        <WorkspaceBottomNav
          items={[
            { key: "home", label: translate(locale, "Overview"), icon: <IconHome aria-hidden="true" stroke={1.5} />, href: "/workspace" },
            { key: "calendar", label: translate(locale, "Appointments"), icon: <IconCalendar aria-hidden="true" stroke={1.5} />, href: "/workspace/appointments" },
            { key: "customers", label: translate(locale, "Customers"), icon: <IconUsers aria-hidden="true" stroke={1.5} />, href: "/workspace/customers" },
            { key: "reports", label: translate(locale, "Reports"), icon: <IconChartBar aria-hidden="true" stroke={1.5} />, href: "/workspace/reports" },
            { key: "settings", label: translate(locale, "Settings"), icon: <IconSettings aria-hidden="true" stroke={1.5} />, href: "/workspace/settings" },
          ]}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}
