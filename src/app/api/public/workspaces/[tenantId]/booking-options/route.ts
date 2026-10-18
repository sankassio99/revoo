import { NextResponse } from "next/server";
import { getPublicBookingOptions } from "@/features/public-booking/public-catalog.service";
import { PublicBookingError } from "@/features/public-booking/public-booking.service";
import { logger } from "@/lib/observability/logger";

export async function GET(_request: Request, context: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await context.params;
  try {
    return NextResponse.json(await getPublicBookingOptions(tenantId));
  } catch (error) {
    if (error instanceof PublicBookingError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    logger.error("public_booking.options_failed", { tenantId });
    return NextResponse.json({ error: "Unable to load booking options." }, { status: 500 });
  }
}
