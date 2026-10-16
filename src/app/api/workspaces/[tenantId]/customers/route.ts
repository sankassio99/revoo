import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { createCustomer, listCustomers } from "@/features/customers/customer.service";
import { logger } from "@/lib/observability/logger";

type RouteContext = { params: Promise<{ tenantId: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to view customers." }, { status: 401 });
  }

  const { tenantId } = await params;
  const search = new URL(request.url).searchParams.get("q") ?? "";
  try {
    const customers = await listCustomers(user, tenantId, search);
    return NextResponse.json({ customers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown failure";
    const forbidden = message.includes("do not have access");
    if (!forbidden) {
      logger.error("customer.list_failed", { tenantId, userId: user.uid, message });
    }
    return NextResponse.json(
      { error: forbidden ? message : "Customers could not be loaded." },
      { status: forbidden ? 403 : 500 },
    );
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to add a customer." }, { status: 401 });
  }

  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const { tenantId } = await params;
  try {
    const result = await createCustomer(user, tenantId, input);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Customer could not be created.";
    const status = message.startsWith("Enter ")
      ? 400
      : message.includes("do not have access")
        ? 403
        : 500;
    if (status === 500) {
      logger.error("customer.create_failed", { tenantId, userId: user.uid, message });
    }
    return NextResponse.json(
      { error: status === 500 ? "Customer could not be saved. Please try again." : message },
      { status },
    );
  }
}
