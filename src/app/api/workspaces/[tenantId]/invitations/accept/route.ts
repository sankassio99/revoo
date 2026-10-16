import { NextResponse } from "next/server";
import { acceptInvitation } from "@/features/workspaces/invitation.service";
import { getSessionUser } from "@/lib/auth/session";
import { logger } from "@/lib/observability/logger";

type RouteContext = { params: Promise<{ tenantId: string }> };

export async function POST(request: Request, { params }: RouteContext) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to accept this invitation." }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  if (typeof body !== "object" || body === null || !("token" in body) || typeof body.token !== "string") {
    return NextResponse.json({ error: "This invitation link is invalid or expired." }, { status: 400 });
  }

  const { tenantId } = await params;
  try {
    const result = await acceptInvitation(user, tenantId, body.token);
    if (!result.accepted) {
      return NextResponse.json({ error: result.reason }, { status: 410 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown failure";
    const invalid = message.includes("invitation") ||
      message.includes("Verify your account") ||
      message.includes("Sign in with") ||
      message.includes("already belong");
    if (!invalid) logger.error("invitation.accept_failed", { tenantId, userId: user.uid, message });
    return NextResponse.json(
      { error: invalid ? message : "Invitation could not be accepted." },
      { status: invalid ? 400 : 500 },
    );
  }
}
