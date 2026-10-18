"use client";

import { useLanguage } from "@/features/i18n/language-provider";
import { formatCurrency, formatDate, formatNumber } from "@/lib/i18n/format";
import { translate } from "@/lib/i18n/messages";

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

export function BookingConfirmation({ appointment }: { appointment: PublicBookingConfirmation }) {
  const { locale } = useLanguage();
  const localDate = appointment.localStart.slice(0, 10);
  const parsedDate = new Date(`${localDate}T00:00:00.000Z`);
  const displayDate = Number.isNaN(parsedDate.valueOf())
    ? localDate
    : formatDate(parsedDate, locale, { dateStyle: "medium", timeZone: "UTC" });
  const start = appointment.localStart.slice(11);
  const end = appointment.localEnd.slice(11);
  const t = (text: string) => translate(locale, text);
  return (
    <section className="rounded-[2rem] border border-forest/10 bg-white p-7 shadow-sm sm:p-10" aria-labelledby="booking-confirmation-title">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest">{t(appointment.status)}</p>
      <h2 id="booking-confirmation-title" className="mt-2 text-3xl font-medium tracking-tight text-ink">{t("Your appointment is booked")}</h2>
      <p className="mt-2 text-sm text-muted">{t(`We’ve saved your appointment with ${appointment.workspaceName}.`)}</p>
      <dl className="mt-7 grid gap-4 border-t border-line pt-6 sm:grid-cols-2">
        <div><dt className="text-xs text-muted">{t("Professional")}</dt><dd className="mt-1 text-sm font-medium text-ink">{appointment.professionalName}</dd></div>
        <div><dt className="text-xs text-muted">{t("Date and time")}</dt><dd className="mt-1 text-sm font-medium text-ink">{displayDate} · {start}–{end}</dd></div>
        <div className="sm:col-span-2"><dt className="text-xs text-muted">{t("Services")}</dt>
          <dd className="mt-2 divide-y divide-line">
            {appointment.services.map((service, index) => (
              <div className="flex items-center justify-between gap-4 py-3 text-sm" key={`${service.name}-${index}`}>
                <span className="font-medium text-ink">{service.name}<span className="ml-2 text-xs font-normal text-muted">{formatNumber(service.durationMinutes, locale)} {t("min")}</span></span>
                <span className="text-muted">{formatCurrency(service.priceMinorUnits / 100, "EUR", locale)}</span>
              </div>
            ))}
          </dd>
        </div>
        <div><dt className="text-xs text-muted">{t("Time zone")}</dt><dd className="mt-1 text-sm font-medium text-ink">{appointment.timeZone}</dd></div>
        {appointment.id && <div><dt className="text-xs text-muted">{t("Reference")}</dt><dd className="mt-1 font-mono text-sm text-ink">{appointment.id}</dd></div>}
      </dl>
    </section>
  );
}
