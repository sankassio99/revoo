import { notFound } from "next/navigation";
import { PublicBookingExperience } from "@/features/public-booking/public-booking-experience";
import { getPublicBookingOptions } from "@/features/public-booking/public-catalog.service";
import { PublicBookingError } from "@/features/public-booking/public-booking.service";

export default async function PublicBookingPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  let options;
  try {
    options = await getPublicBookingOptions(tenantId);
  } catch (error) {
    if (error instanceof PublicBookingError && error.status === 404) notFound();
    throw error;
  }
  return <PublicBookingExperience options={options} tenantId={tenantId} />;
}
