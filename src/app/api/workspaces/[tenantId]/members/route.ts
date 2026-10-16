import { NextResponse } from "next/server";
import { listWorkspaceMembers, revokeMembership } from "@/features/workspaces/invitation.service";
import { getSessionUser } from "@/lib/auth/session";
import { logger } from "@/lib/observability/logger";

type RouteContext = { params: Promise<{ tenantId: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in to view team members." }, { status: 401 });
  const { tenantId } = await params;
  try {
    return NextResponse.json({ members: await listWorkspaceMembers(user, tenantId) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown failure";
    const forbidden = message.includes("do not have access") || message.includes("Only workspace owners");
    if (!forbidden) logger.error("workspace.members_list_failed", { tenantId, userId: user.uid, message });
    return NextResponse.json(
      { error: forbidden ? message : "Team members could not be loaded." },
      { status: forbidden ? 403 : 500 },
    );
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in to manage team members." }, { status: 401 });
  const memberUserId = new URL(request.url).searchParams.get("userId");
  if (!memberUserId) {
    return NextResponse.json({ error: "Choose a team member." }, { status: 400 });
  }
  const { tenantId } = await params;
  try {
    await revokeMembership(user, tenantId, memberUserId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown failure";
    const forbidden = message.includes("do not have access") || message.includes("Only workspace owners");
    const invalid = message.includes("cannot revoke their own");
    const missing = message.includes("membership not found");
    const status = forbidden ? 403 : missing ? 404 : invalid ? 400 : 500;
    if (status === 500) logger.error("workspace.member_revoke_failed", { tenantId, userId: user.uid, message });
    return NextResponse.json(
      { error: status === 500 ? "Team member access could not be revoked." : message },
      { status },
    );
  }
}
