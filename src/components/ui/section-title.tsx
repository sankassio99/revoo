import * as React from "react";
import { cn } from "cn";

export type SectionTitleProps = { eyebrow?: string; title: string; action?: React.ReactNode; className?: string };

function SectionTitle({ eyebrow, title, action, className }: SectionTitleProps) {
  return (
    <div className={cn("flex min-w-0 items-end justify-between gap-3", className)}>
      <div className="min-w-0">
        {eyebrow && <p className="mb-1 text-caption font-medium uppercase tracking-[0.08em] text-brand">{eyebrow}</p>}
        <h2 className="truncate text-title font-normal">{title}</h2>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export { SectionTitle };
