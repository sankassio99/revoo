import Link from "next/link";
import { ArrowRight, UsersThree } from "@phosphor-icons/react/dist/ssr";
import { getWorkspaceSettings } from "@/features/workspaces/workspace-settings.service";
import { WorkspaceSettingsForm } from "@/features/workspaces/workspace-settings-form";
import { getCurrentWorkspace } from "@/lib/auth/current-workspace";
import { getSessionUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { LanguageSelector } from "@/features/i18n/language-selector";
import { getRequestLocale } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/messages";

export const dynamic = "force-dynamic";

export default async function WorkspaceSettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { workspace } = await getCurrentWorkspace(user);
  const locale = await getRequestLocale();
  if (!workspace) {
    return (
      <section className="py-12">
        <h1 className="text-3xl font-medium tracking-[-0.06em] text-ink">{translate(locale, "Business settings")}</h1>
        <p className="mt-2 text-sm text-muted">{translate(locale, "Create a workspace before configuring business settings.")}</p>
        <Link className="mt-4 inline-block text-sm text-forest underline underline-offset-4" href="/workspace/new">{translate(locale, "Create a workspace")}</Link>
      </section>
    );
  }

  const settings = await getWorkspaceSettings(user, workspace.tenantId);
  return (
    <div className="page-reveal">
      <div className="flex flex-col justify-between gap-5 border-b border-line pb-7 sm:flex-row sm:items-end">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">{translate(locale, "Set the pace")}</p>
          <h1 className="mt-3 text-3xl font-medium tracking-[-0.065em] text-ink sm:text-[2.75rem]">{translate(locale, "Business settings")}</h1>
          <p className="mt-2 text-sm text-muted">{workspace.name} <span className="px-1 text-line">·</span> {translate(locale, workspace.role)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <LanguageSelector />
          <Link className="inline-flex min-h-10 items-center gap-2 text-xs font-medium text-forest hover:underline" href="/workspace/settings/catalog">
            {translate(locale, "Services and team")} <ArrowRight size={14} />
          </Link>
        </div>
      </div>
      {workspace.role !== "owner" && (
        <p className="mt-5 border-l-2 border-accent pl-3 text-xs leading-5 text-muted">{translate(locale, "Only workspace owners can make changes. You can view the current business configuration below.")}</p>
      )}
      <div className="pt-7">
        <WorkspaceSettingsForm initial={settings} owner={workspace.role === "owner"} tenantId={workspace.tenantId} />
      </div>
      {workspace.role === "owner" && (
        <Link className="mt-8 inline-flex items-center gap-2 border-t border-line pt-5 text-xs font-medium text-forest hover:underline" href="/workspace/settings/team">
          <UsersThree size={15} /> {translate(locale, "Manage team invitations")} <ArrowRight size={14} />
        </Link>
      )}
    </div>
  );
}
