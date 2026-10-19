"use client";

import { useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { WeekStrip } from "@/components/ui/week-strip";
import { useLanguage } from "@/features/i18n/language-provider";

function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year!, month! - 1, day!);
}

function formatDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function AppointmentWeekStrip({ date, view }: { date: string; view: "day" | "week" }) {
  const router = useRouter();
  const { locale } = useLanguage();
  const [pending, startTransition] = useTransition();
  const selected = useMemo(() => parseDate(date), [date]);
  const days = useMemo(() => {
    const monday = new Date(selected);
    monday.setDate(selected.getDate() - ((selected.getDay() + 6) % 7));
    const formatter = new Intl.DateTimeFormat(locale, { weekday: "short" });
    return Array.from({ length: 7 }, (_, index) => {
      const day = new Date(monday);
      day.setDate(monday.getDate() + index);
      return { date: day, label: formatter.format(day).replace(".", "") };
    });
  }, [selected, locale]);

  return (
    <div aria-busy={pending} className="relative">
      <WeekStrip
        className={pending ? "pointer-events-none opacity-60 transition-opacity" : "transition-opacity"}
        days={days}
        onSelect={(next) => {
          if (formatDate(next) === date) return;
          startTransition(() => router.push(`/workspace/appointments?date=${formatDate(next)}&view=${view}`));
        }}
        selected={selected}
      />
      {pending && (
        <div className="absolute inset-x-0 -bottom-3 h-1 overflow-hidden rounded-full bg-brand-soft" role="status">
          <span className="sr-only">Loading</span>
          <div className="h-full w-1/3 animate-pulse rounded-full bg-brand motion-reduce:animate-none" />
        </div>
      )}
    </div>
  );
}
