import { NextResponse } from "next/server";
import {
  createProfessional,
  createService,
  listCatalog,
  updateCatalogRecord,
} from "@/features/catalog/catalog.service";
import { getSessionUser } from "@/lib/auth/session";
import { logger } from "@/lib/observability/logger";
import { isRecord } from "@/lib/validation/common";

type RouteContext = { params: Promise<{ tenantId: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in to view catalog." }, { status: 401 });
  const { tenantId } = await params;
  try {
    return NextResponse.json(await listCatalog(user, tenantId));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown failure";
    const forbidden = message.includes("do not have access");
    if (!forbidden) logger.error("catalog.list_failed", { tenantId, userId: user.uid, message });
    return NextResponse.json(
      { error: forbidden ? message : "Catalog could not be loaded." },
      { status: forbidden ? 403 : 500 },
    );
  }
}

async function readBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in to manage catalog." }, { status: 401 });
  const input = await readBody(request);
  if (!isRecord(input) || (input.kind !== "service" && input.kind !== "professional")) {
    return NextResponse.json({ error: "Choose a valid catalog record type." }, { status: 400 });
  }

  const { tenantId } = await params;
  try {
    const id =
      input.kind === "service"
        ? await createService(user, tenantId, input.value)
        : await createProfessional(user, tenantId, input.value);
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    return catalogError(error, tenantId, user.uid, "create");
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in to manage catalog." }, { status: 401 });
  const input = await readBody(request);
  if (
    !isRecord(input) ||
    (input.kind !== "service" && input.kind !== "professional") ||
    typeof input.id !== "string" ||
    !isRecord(input.value)
  ) {
    return NextResponse.json({ error: "Provide a valid catalog update." }, { status: 400 });
  }
  const { tenantId } = await params;
  try {
    await updateCatalogRecord(user, tenantId, input.kind, input.id, input.value);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return catalogError(error, tenantId, user.uid, "update");
  }
}

function catalogError(error: unknown, tenantId: string, userId: string, operation: string) {
  const message = error instanceof Error ? error.message : "Unknown failure";
  const forbidden =
    message.includes("do not have access") ||
    message.includes("Only workspace owners");
  const notFound = message === "Catalog record not found.";
  const invalid = message.startsWith("Enter ") ||
    message.startsWith("Select ") ||
    message.startsWith("Each ") ||
    message.startsWith("Provide valid");
  const status = forbidden ? 403 : notFound ? 404 : invalid ? 400 : 500;
  if (status === 500) {
    logger.error(`catalog.${operation}_failed`, { tenantId, userId, message });
  }
  return NextResponse.json(
    { error: status === 500 ? "Catalog change could not be saved." : message },
    { status },
  );
}
