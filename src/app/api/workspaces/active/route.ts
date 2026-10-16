import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { requireWorkspaceMember } from "@/lib/auth/authorization";
import { tenantIdSchema } from "@/lib/validation/common";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to switch workspaces." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("tenantId" in body) ||
    typeof body.tenantId !== "string" ||
    !tenantIdSchema.safeParse(body.tenantId).success
  ) {
    return NextResponse.json({ error: "A valid workspace is required." }, { status: 400 });
  }

  try {
    await requireWorkspaceMember(user, body.tenantId);
    const response = NextResponse.json({ ok: true });
    response.cookies.set("revoo_workspace", body.tenantId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return response;
  } catch {
    return NextResponse.json({ error: "You do not have access to this workspace." }, { status: 403 });
  }
}
