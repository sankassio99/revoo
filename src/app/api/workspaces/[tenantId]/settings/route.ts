import { NextResponse } from "next/server";
import {
  getWorkspaceSettings,
  updateWorkspaceSettings,
} from "@/features/workspaces/workspace-settings.service";
import { getSessionUser } from "@/lib/auth/session";
import { logger } from "@/lib/observability/logger";

type RouteContext = { params: Promise<{ tenantId: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in to view settings." }, { status: 401 });
  const { tenantId } = await params;
  try {
    return NextResponse.json(await getWorkspaceSettings(user, tenantId));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown failure";
    const forbidden = message.includes("do not have access");
    if (!forbidden) logger.error("workspace.settings_read_failed", { tenantId, userId: user.uid, message });
    return NextResponse.json(
      { error: forbidden ? message : "Workspace settings could not be loaded." },
      { status: forbidden ? 403 : 500 },
    );
  }
}

export async function PUT(request: Request, { params }: RouteContext) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in to update settings." }, { status: 401 });
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  const { tenantId } = await params;
  try {
    await updateWorkspaceSettings(user, tenantId, input);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown failure";
    const forbidden =
      message.includes("do not have access") ||
      message.includes("Only workspace owners");
    const invalid = message.startsWith("Review the business details");
    const status = forbidden ? 403 : invalid ? 400 : 500;
    if (status === 500) {
      logger.error("workspace.settings_update_failed", { tenantId, userId: user.uid, message });
    }
    return NextResponse.json(
      { error: status === 500 ? "Workspace settings could not be saved." : message },
      { status },
    );
  }
}
