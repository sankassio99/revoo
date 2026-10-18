import { NextResponse } from "next/server";
import { calculateAvailability } from "@/features/public-booking/availability.service";
import { PublicBookingError } from "@/features/public-booking/public-booking.service";
import { publicAvailabilityQuerySchema } from "@/features/public-booking/public-booking.schema";
import { logger } from "@/lib/observability/logger";

export async function GET(request: Request, context: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await context.params;
  const url = new URL(request.url);
  const parsed = publicAvailabilityQuerySchema.safeParse({
    professionalId: url.searchParams.get("professionalId"),
    serviceIds: url.searchParams.getAll("serviceIds"),
    date: url.searchParams.get("date"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Choose a valid professional, service selection, and date." }, { status: 400 });
  }
  try {
    return NextResponse.json(await calculateAvailability(tenantId, parsed.data));
  } catch (error) {
    if (error instanceof PublicBookingError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    logger.error("public_booking.availability_failed", { tenantId });
    return NextResponse.json({ error: "Unable to load availability." }, { status: 500 });
  }
}
