"use client";

import * as React from "react";
import { cn } from "cn";

export type SegmentedOption = { value: string; label: string };
export type SegmentedControlProps = { options: SegmentedOption[]; value: string; onChange: (value: string) => void; className?: string; compact?: boolean };

function SegmentedControl({ options, value, onChange, className, compact = false }: SegmentedControlProps) {
  const refs = React.useRef<Array<HTMLButtonElement | null>>([]);
  return (
    <div role="radiogroup" className={cn("inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-full bg-surface p-1", className)}>
      {options.map((option, index) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            ref={(node) => { refs.current[index] = node; }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => {
              const direction = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
              if (direction) {
                event.preventDefault();
                const next = (index + direction + options.length) % options.length;
                refs.current[next]?.focus();
                onChange(options[next]!.value);
              }
            }}
            className={cn("relative min-h-10 shrink-0 rounded-full px-5 text-sm text-muted transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand after:absolute after:-inset-y-0.5 after:content-['']", compact && "min-h-9 px-3.5 text-xs after:-inset-y-1", selected && "bg-brand text-white")}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export { SegmentedControl };
