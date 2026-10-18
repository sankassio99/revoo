"use client";

export type PublicBookingConfirmation = {
  id?: string;
  workspaceName: string;
  professionalName: string;
  services: Array<{ name: string; durationMinutes: number; priceMinorUnits: number }>;
  localStart: string;
  localEnd: string;
  timeZone: string;
  status: string;
};

function money(minorUnits: number) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "EUR" }).format(minorUnits / 100);
}

export function BookingConfirmation({ appointment }: { appointment: PublicBookingConfirmation }) {
  const start = appointment.localStart.replace("T", " ");
  const end = appointment.localEnd.slice(11);
  return (
    <section className="rounded-[2rem] border border-forest/10 bg-white p-7 shadow-sm sm:p-10" aria-labelledby="booking-confirmation-title">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest">{appointment.status}</p>
      <h2 id="booking-confirmation-title" className="mt-2 text-3xl font-medium tracking-tight text-ink">Your appointment is booked</h2>
      <p className="mt-2 text-sm text-muted">We’ve saved your appointment with {appointment.workspaceName}.</p>
      <dl className="mt-7 grid gap-4 border-t border-line pt-6 sm:grid-cols-2">
        <div><dt className="text-xs text-muted">Professional</dt><dd className="mt-1 text-sm font-medium text-ink">{appointment.professionalName}</dd></div>
        <div><dt className="text-xs text-muted">Date and time</dt><dd className="mt-1 text-sm font-medium text-ink">{start}–{end}</dd></div>
        <div className="sm:col-span-2"><dt className="text-xs text-muted">Services</dt>
          <dd className="mt-2 divide-y divide-line">
            {appointment.services.map((service, index) => (
              <div className="flex items-center justify-between gap-4 py-3 text-sm" key={`${service.name}-${index}`}>
                <span className="font-medium text-ink">{service.name}<span className="ml-2 text-xs font-normal text-muted">{service.durationMinutes} min</span></span>
                <span className="text-muted">{money(service.priceMinorUnits)}</span>
              </div>
            ))}
          </dd>
        </div>
        <div><dt className="text-xs text-muted">Time zone</dt><dd className="mt-1 text-sm font-medium text-ink">{appointment.timeZone}</dd></div>
        {appointment.id && <div><dt className="text-xs text-muted">Reference</dt><dd className="mt-1 font-mono text-sm text-ink">{appointment.id}</dd></div>}
      </dl>
    </section>
  );
}
