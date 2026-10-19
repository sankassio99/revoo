"use client";

import { useState } from "react";
import { IconArrowLeft, IconMapPin } from "@tabler/icons-react";
import { ActionBar } from "@/components/ui/action-bar";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CoverHeader } from "@/components/ui/cover-header";
import { HoursCard } from "@/components/ui/hours-card";
import { SectionTitle } from "@/components/ui/section-title";
import { ServiceRow } from "@/components/ui/service-row";
import { LanguageSelector } from "@/features/i18n/language-selector";
import { useLanguage } from "@/features/i18n/language-provider";
import { BookingSelection } from "@/features/public-booking/booking-selection";
import type { PublicBookingOptions } from "@/features/public-booking/public-booking.types";
import { translate } from "@/lib/i18n/messages";
import type { WorkspaceSettingsInput } from "@/features/workspaces/workspace-settings.schema";
import { cn } from "cn";

const weekdays = [
  ["monday", "Monday"],
  ["tuesday", "Tuesday"],
  ["wednesday", "Wednesday"],
  ["thursday", "Thursday"],
  ["friday", "Friday"],
  ["saturday", "Saturday"],
  ["sunday", "Sunday"],
] as const;

function groupedHours(
  hours: WorkspaceSettingsInput["operatingHours"],
  t: (text: string) => string,
) {
  const groups: {
    days: string[];
    closed: boolean;
    open: string;
    close: string;
  }[] = [];

  for (const [day, label] of weekdays) {
    const schedule = hours[day];
    const previous = groups.at(-1);
    if (
      previous &&
      previous.closed === schedule.closed &&
      previous.open === schedule.open &&
      previous.close === schedule.close
    ) {
      previous.days.push(label);
    } else {
      groups.push({ days: [label], ...schedule });
    }
  }

  return groups.map(({ days, closed, open, close }) => ({
    label: days.length > 1
      ? `${t(days[0] ?? "")} - ${t(days[days.length - 1] ?? "")}`
      : t(days[0] ?? ""),
    value: closed ? t("Closed") : `${open} - ${close}`,
  }));
}

function serviceCategory(name: string): "cabelo" | "barba" | "coloracao" | "combo" | "outro" {
  const normalized = name.toLocaleLowerCase();
  if (/barba|barber|beard|shave/.test(normalized)) return "barba";
  if (/color|dye|colora/.test(normalized)) return "coloracao";
  if (/cabelo|hair|corte|cut/.test(normalized)) return "cabelo";
  return "outro";
}

export function PublicBookingExperience({
  tenantId,
  options,
}: {
  tenantId: string;
  options: PublicBookingOptions;
}) {
  const [view, setView] = useState<"studio" | "booking">("studio");
  const { locale, setLocale } = useLanguage();
  const t = (text: string) => translate(locale, text);

  if (view === "booking") {
    return (
      <main className="min-h-screen bg-[#f4f5f0] px-4 py-8 sm:px-8 sm:py-12">
        <div className="mx-auto max-w-6xl">
          <header className="mb-6 flex items-center justify-between gap-4">
            <Button
              leftIcon={<IconArrowLeft aria-hidden="true" stroke={1.5} />}
              onClick={() => setView("studio")}
              variant="ghost"
            >
              {t("Back to studio")}
            </Button>
            <LanguageSelector className="shrink-0" />
          </header>
          <BookingSelection options={options} tenantId={tenantId} />
          <footer className="mt-10 text-center text-xs text-muted">
            {t(`Times are shown in ${options.workspace.timeZone}.`)}
          </footer>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh px-3 py-5 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-[760px] rounded-[28px] bg-canvas p-3 pb-24 shadow-xl sm:p-4 sm:pb-6">
        <div className="relative">
          <CoverHeader className="px-0" name={options.workspace.name} actions={[]} />
          <div aria-hidden="true" className="pointer-events-none absolute left-5 top-7 text-white">
            <p className="text-3xl font-medium tracking-[-0.04em]">{options.workspace.name}</p>
            <p className="mt-1 text-xs font-medium uppercase tracking-[0.16em] text-brand-tint">{t("Studio")}</p>
          </div>
        </div>
        <div className="px-1 pb-2 pt-5 sm:px-2 sm:pt-6">
          <div className="grid gap-3">
            <p className="text-sm leading-6 text-muted">{t("Meet the team and explore our services before booking.")}</p>
            {options.workspace.address && (
              <p className="flex items-center gap-2 text-sm text-muted">
                <IconMapPin aria-hidden="true" size={17} stroke={1.5} />
                <span>{options.workspace.address}</span>
              </p>
            )}
          </div>

          {options.professionals.length > 0 && (
            <section aria-label={t("Team")} className="mt-7 grid gap-3">
              <SectionTitle title={t("Team")} />
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {options.professionals.map((professional, index) => {
                  const services = professional.serviceIds
                    .map((serviceId) => options.services.find((service) => service.id === serviceId)?.name)
                    .filter((name): name is string => Boolean(name));
                  return (
                    <Card
                      className={cn(
                        "min-h-36 rounded-card p-4",
                        index % 2 === 0 ? "bg-brand text-white" : "bg-leaf text-leaf-deep",
                      )}
                      key={professional.id}
                    >
                      <Avatar
                        className={cn("bg-surface", index % 2 === 0 ? "text-brand" : "text-leaf-deep")}
                        name={professional.name}
                        size={48}
                      />
                      <div className="mt-6">
                        <h3 className="truncate text-base font-medium">{professional.name}</h3>
                        <p className={cn("truncate text-sm", index % 2 === 0 ? "text-brand-tint" : "text-leaf-mid")}>
                          {services.length ? services.join(", ") : t("Professional")}
                        </p>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </section>
          )}

          {options.services.length > 0 && (
            <section aria-label={t("Services")} className="mt-7 grid gap-3">
              <SectionTitle title={t("Services")} />
              <ul className="grid gap-2">
                {options.services.map((service) => (
                  <li key={service.id}>
                    <ServiceRow
                      category={serviceCategory(service.name)}
                      currency={options.workspace.currency}
                      duration={service.durationMinutes}
                      locale={locale === "pt" ? "pt-PT" : "en-GB"}
                      name={service.name}
                      price={service.priceMinorUnits / 100}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {options.workspace.operatingHours && (
            <section aria-label={t("Operating hours")} className="mt-7 grid gap-3">
              <SectionTitle title={t("Operating hours")} />
              <HoursCard
                closedLabel={t("Closed")}
                open={options.workspace.isOpenNow}
                openLabel={t("Open now")}
                rows={groupedHours(options.workspace.operatingHours, t)}
              />
            </section>
          )}
        </div>
      </div>
      <ActionBar
        ctaLabel={t("Book an appointment")}
        locale={locale}
        onCta={() => setView("booking")}
        onLocaleChange={setLocale}
        wide
      />
    </main>
  );
}
