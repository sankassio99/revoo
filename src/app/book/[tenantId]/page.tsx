import { notFound } from "next/navigation";
import { BookingSelection } from "@/features/public-booking/booking-selection";
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
  return (
    <main className="min-h-screen bg-[#f4f5f0] px-4 py-10 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Book a visit</p>
          <h1 className="mt-3 text-4xl font-medium tracking-[-0.055em] text-ink sm:text-5xl">{options.workspace.name}</h1>
          <p className="mt-3 text-sm leading-6 text-muted">Choose your service and a time that works for you.</p>
        </header>
        <BookingSelection options={options} tenantId={tenantId} />
        <footer className="mt-10 text-center text-xs text-muted">Times are shown in {options.workspace.timeZone}.</footer>
      </div>
    </main>
  );
}
