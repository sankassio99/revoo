import { NextResponse } from "next/server";
import {
  archiveCustomer,
  updateCustomer,
} from "@/features/customers/customer.service";
import { getSessionUser } from "@/lib/auth/session";
import { logger } from "@/lib/observability/logger";

type RouteContext = { params: Promise<{ tenantId: string; customerId: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to update customers." }, { status: 401 });
  }
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const { tenantId, customerId } = await params;
  if (typeof input === "object" && input !== null && "archive" in input && input.archive === true) {
    try {
      const archived = await archiveCustomer(user, tenantId, customerId);
      return archived
        ? NextResponse.json({ ok: true })
        : NextResponse.json({ error: "Customer not found." }, { status: 404 });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown failure";
      const forbidden = message.includes("do not have access");
      if (!forbidden) {
        logger.error("customer.archive_failed", { tenantId, userId: user.uid, message });
      }
      return NextResponse.json(
        { error: forbidden ? message : "Customer could not be archived." },
        { status: forbidden ? 403 : 500 },
      );
    }
  }

  try {
    const result = await updateCustomer(user, tenantId, customerId, input);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown failure";
    const status = message.startsWith("Provide valid") || message.startsWith("Enter ")
      ? 400
      : message === "Customer not found."
        ? 404
        : message.includes("do not have access")
          ? 403
          : 500;
    if (status === 500) {
      logger.error("customer.update_failed", { tenantId, userId: user.uid, message });
    }
    return NextResponse.json(
      { error: status === 500 ? "Customer could not be updated." : message },
      { status },
    );
  }
}
