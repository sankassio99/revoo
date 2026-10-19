"use client";

import { IconCalendarPlus } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { cn } from "cn";

type ActionBarOptions = {
  ctaLabel: string;
  locale: "pt" | "en";
  onLocaleChange: (locale: "pt" | "en") => void;
  static?: boolean;
  wide?: boolean;
  className?: string;
};

export type ActionBarProps = ActionBarOptions & ({ href: string; onCta?: never } | { href?: never; onCta: () => void });

function ActionBar({ ctaLabel, onCta, href, locale, onLocaleChange, static: isStatic = false, wide = false, className }: ActionBarProps) {
  return (
    <div className={cn(isStatic ? "relative px-4 pb-4" : "fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(16px,env(safe-area-inset-bottom))]", className)}>
      <div className={cn("mx-auto flex w-full items-center gap-2 rounded-full bg-surface p-2", wide ? "max-w-[760px]" : "max-w-md")}>
        <Button
          href={href}
          onClick={onCta}
          leftIcon={<IconCalendarPlus aria-hidden="true" stroke={1.5} />}
          className="h-[52px] flex-1 text-base"
        >
          {ctaLabel}
        </Button>
        <SegmentedControl
          compact
          className="bg-canvas"
          options={[{ value: "pt", label: "PT" }, { value: "en", label: "ENG" }]}
          value={locale}
          onChange={(next) => {
            if (next === "pt" || next === "en") onLocaleChange(next);
          }}
        />
      </div>
    </div>
  );
}

export { ActionBar };
