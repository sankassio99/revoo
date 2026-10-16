import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { createWorkspace, listUserWorkspaces } from "@/lib/auth/authorization";
import { workspaceInputSchema } from "@/lib/validation/common";
import { logger } from "@/lib/observability/logger";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to view your workspaces." }, { status: 401 });
  }

  const workspaces = await listUserWorkspaces(user);
  return NextResponse.json({ workspaces });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to create a workspace." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = workspaceInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Review the business name, currency, and time zone." },
      { status: 400 },
    );
  }

  try {
    const tenantId = await createWorkspace(user, parsed.data);
    logger.info("workspace.created", { tenantId, userId: user.uid });
    return NextResponse.json({ tenantId }, { status: 201 });
  } catch (error) {
    logger.error("workspace.create_failed", {
      userId: user.uid,
      message: error instanceof Error ? error.message : "Unknown failure",
    });
    return NextResponse.json(
      { error: "We could not finish setting up the workspace. No workspace was created." },
      { status: 500 },
    );
  }
}
