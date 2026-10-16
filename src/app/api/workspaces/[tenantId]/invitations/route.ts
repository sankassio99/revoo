import { NextResponse } from "next/server";
import {
  createInvitation,
  listInvitations,
  revokeInvitation,
} from "@/features/workspaces/invitation.service";
import { getSessionUser } from "@/lib/auth/session";
import { logger } from "@/lib/observability/logger";

type RouteContext = { params: Promise<{ tenantId: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in to view invitations." }, { status: 401 });
  const { tenantId } = await params;
  try {
    return NextResponse.json({ invitations: await listInvitations(user, tenantId) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown failure";
    const forbidden = message.includes("do not have access") || message.includes("Only workspace owners");
    if (!forbidden) logger.error("invitation.list_failed", { tenantId, userId: user.uid, message });
    return NextResponse.json(
      { error: forbidden ? message : "Invitations could not be loaded." },
      { status: forbidden ? 403 : 500 },
    );
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in to invite a team member." }, { status: 401 });
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  const { tenantId } = await params;
  try {
    return NextResponse.json(await createInvitation(user, tenantId, input), { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown failure";
    const forbidden = message.includes("do not have access") || message.includes("Only workspace owners");
    const invalid = message.startsWith("Enter a valid");
    const status = forbidden ? 403 : invalid ? 400 : 500;
    if (status === 500) logger.error("invitation.create_failed", { tenantId, userId: user.uid, message });
    return NextResponse.json(
      { error: status === 500 ? "Invitation could not be created." : message },
      { status },
    );
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in to revoke invitations." }, { status: 401 });
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  const { tenantId } = await params;
  try {
    await revokeInvitation(user, tenantId, input);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown failure";
    const forbidden = message.includes("do not have access") || message.includes("Only workspace owners");
    const invalid = message.startsWith("Choose a valid") || message.startsWith("Only pending");
    const status = forbidden ? 403 : invalid ? 400 : message === "Invitation not found." ? 404 : 500;
    if (status === 500) logger.error("invitation.revoke_failed", { tenantId, userId: user.uid, message });
    return NextResponse.json(
      { error: status === 500 ? "Invitation could not be revoked." : message },
      { status },
    );
  }
}
