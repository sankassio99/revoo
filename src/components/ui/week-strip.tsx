"use client";

import * as React from "react";
import { cn } from "cn";

export type WeekStripDay = { date: Date; label: string };
export type WeekStripProps = { days: WeekStripDay[]; selected: Date; onSelect: (date: Date) => void; className?: string };

function sameDay(first: Date, second: Date) {
  return first.getFullYear() === second.getFullYear() && first.getMonth() === second.getMonth() && first.getDate() === second.getDate();
}

function WeekStrip({ days, selected, onSelect, className }: WeekStripProps) {
  const refs = React.useRef<Array<HTMLButtonElement | null>>([]);
  const activateRelative = (index: number, offset: number) => {
    const nextIndex = (index + offset + days.length) % days.length;
    refs.current[nextIndex]?.focus();
    onSelect(days[nextIndex]!.date);
  };
  return (
    <div role="radiogroup" aria-label="Selecionar dia" className={cn("grid grid-cols-7 gap-1", className)}>
      {days.map(({ date, label }, index) => {
        const active = sameDay(date, selected);
        const today = sameDay(date, new Date());
        const fullLabel = new Intl.DateTimeFormat("pt-PT", { weekday: "long", day: "numeric", month: "long" }).format(date);
        return (
          <div className="flex min-w-0 flex-col items-center gap-2" key={date.toISOString()}>
            <span className="text-caption text-muted">{label}</span>
            <button
              ref={(node) => { refs.current[index] = node; }}
              type="button"
              role="radio"
              aria-label={fullLabel}
              aria-checked={active}
              tabIndex={active ? 0 : -1}
              onClick={() => onSelect(date)}
              onKeyDown={(event) => {
                if (event.key === "ArrowRight" || event.key === "ArrowDown") { event.preventDefault(); activateRelative(index, 1); }
                if (event.key === "ArrowLeft" || event.key === "ArrowUp") { event.preventDefault(); activateRelative(index, -1); }
              }}
              className={cn("relative size-[38px] rounded-full bg-surface text-sm text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand after:absolute after:-inset-[3px] after:content-['']", today && !active && "border border-ink", active && "bg-brand text-white")}
            >
              {date.getDate()}
            </button>
          </div>
        );
      })}
    </div>
  );
}

export { WeekStrip };
