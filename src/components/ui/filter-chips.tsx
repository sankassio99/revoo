"use client";

import * as React from "react";
import { cn } from "cn";

export type FilterChipOption = { value: string; label: string };
export type FilterChipsProps = { options: FilterChipOption[]; value: string; onChange: (value: string) => void; className?: string };

function FilterChips({ options, value, onChange, className }: FilterChipsProps) {
  const buttons = React.useRef<Array<HTMLButtonElement | null>>([]);
  return (
    <div role="tablist" className={cn("flex min-w-0 gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden", className)}>
      {options.map((option, index) => {
        const selected = option.value === value;
        return <button
          key={option.value}
          ref={(node) => { buttons.current[index] = node; }}
          type="button"
          role="tab"
          aria-selected={selected}
          tabIndex={selected ? 0 : -1}
          onClick={() => onChange(option.value)}
          onKeyDown={(event) => {
            const move = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
            if (move) {
              event.preventDefault();
              const next = (index + move + options.length) % options.length;
              buttons.current[next]?.focus();
              onChange(options[next]!.value);
            }
          }}
          className={cn("relative min-h-[34px] shrink-0 rounded-full bg-surface px-3.5 text-[13px] text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand after:absolute after:-inset-y-[5px] after:content-['']", selected && "bg-ink text-white")}
        >
          {option.label}
        </button>;
      })}
    </div>
  );
}

export { FilterChips };
