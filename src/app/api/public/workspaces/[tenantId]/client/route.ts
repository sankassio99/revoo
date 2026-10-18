import { NextResponse } from "next/server";
import { resolvePublicClient, registerPublicClient } from "@/features/public-booking/public-client.service";
import { PublicBookingError } from "@/features/public-booking/public-booking.service";
import { logger } from "@/lib/observability/logger";

export async function POST(request: Request, context: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await context.params;
  try {
    let body: unknown;
    try { body = await request.json(); } catch {
      throw new PublicBookingError("Request body must be valid JSON.", 400);
    }
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      throw new PublicBookingError("Provide valid client details.", 400);
    }
    const record = body as Record<string, unknown>;
    const identity = { email: typeof record.email === "string" ? record.email : "" };
    if (Object.keys(record).length === 1 && typeof record.email === "string") {
      const result = await resolvePublicClient(tenantId, identity);
      return result.registrationRequired
        ? NextResponse.json({ registrationRequired: true }, { status: 404 })
        : NextResponse.json(result, { status: 200 });
    }
    return NextResponse.json(await registerPublicClient(tenantId, identity, body), { status: 201 });
  } catch (error) {
    if (error instanceof PublicBookingError) {
      const status = [400, 401, 403, 404, 409].includes(error.status) ? error.status : 500;
      return NextResponse.json({ error: error.message }, { status });
    }
    logger.error("public_booking.client_failed", { tenantId });
    return NextResponse.json({ error: "Unable to check client details." }, { status: 500 });
  }
}
