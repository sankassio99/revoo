import Link from "next/link";
import { redirect } from "next/navigation";
import { InvitationManager } from "@/features/workspaces/invitation-manager";
import { listInvitations, listWorkspaceMembers } from "@/features/workspaces/invitation.service";
import { getCurrentWorkspace } from "@/lib/auth/current-workspace";
import { getSessionUser } from "@/lib/auth/session";
import { getRequestLocale } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/messages";

export const dynamic = "force-dynamic";

export default async function TeamSettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { workspace } = await getCurrentWorkspace(user);
  const locale = await getRequestLocale();
  if (!workspace) {
    return <section className="py-12"><h1 className="text-3xl font-medium text-ink">{translate(locale, "Team")}</h1><Link className="mt-4 inline-block text-sm text-forest underline" href="/workspace/new">{translate(locale, "Create a workspace")}</Link></section>;
  }
  if (workspace.role !== "owner") {
    return (
      <section className="py-12">
        <h1 className="text-3xl font-medium tracking-[-0.06em] text-ink">{translate(locale, "Team")}</h1>
        <p className="mt-2 text-sm text-muted">{translate(locale, "Only workspace owners can manage invitations.")}</p>
      </section>
    );
  }
  const [invitations, members] = await Promise.all([
    listInvitations(user, workspace.tenantId),
    listWorkspaceMembers(user, workspace.tenantId),
  ]);

  return (
    <div className="page-reveal">
      <Link className="text-xs font-medium text-muted hover:text-forest" href="/workspace/settings">{translate(locale, "Business settings")}</Link>
      <div className="mt-5 border-b border-line pb-7">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">{translate(locale, "Grow together")}</p>
        <h1 className="mt-2 text-3xl font-medium tracking-[-0.065em] text-ink sm:text-[2.75rem]">{translate(locale, "Team access")}</h1>
        <p className="mt-2 text-sm text-muted">{workspace.name} <span className="px-1 text-line">·</span> {translate(locale, "Owners manage the workspace; staff manage customers and appointments.")}</p>
      </div>
      <div className="pt-7">
        <InvitationManager invitations={invitations} members={members} tenantId={workspace.tenantId} />
      </div>
    </div>
  );
}
