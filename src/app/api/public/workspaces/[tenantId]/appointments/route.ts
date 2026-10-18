import { NextResponse } from "next/server";
import { createPublicAppointment } from "@/features/public-booking/public-appointment.service";
import { PublicBookingError } from "@/features/public-booking/public-booking.service";
import { logger } from "@/lib/observability/logger";

export async function POST(request: Request, context: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await context.params;
  try {
    let body: unknown;
    try { body = await request.json(); }
    catch { throw new PublicBookingError("Request body must be valid JSON.", 400); }
    return NextResponse.json(await createPublicAppointment(tenantId, body), { status: 201 });
  } catch (error) {
    if (error instanceof PublicBookingError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    logger.error("public_booking.appointment_failed", { tenantId });
    return NextResponse.json({ error: "Unable to create this appointment." }, { status: 500 });
  }
}
