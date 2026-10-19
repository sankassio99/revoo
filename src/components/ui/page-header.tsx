import * as React from "react";
import { cn } from "cn";

export type PageHeaderProps = { title: string; subtitle?: string; action?: React.ReactNode; eyebrow?: string; className?: string };

function PageHeader({ title, subtitle, action, eyebrow, className }: PageHeaderProps) {
  return (
    <header className={cn("flex items-end justify-between gap-3", className)}>
      <div className="min-w-0">
        {eyebrow && <p className="mb-2 text-caption font-medium uppercase tracking-[0.08em] text-brand">{eyebrow}</p>}
        <h1 className="text-display font-normal">{title}</h1>
        {subtitle && <p className="mt-1.5 text-[14px] leading-[1.5] text-muted">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}

export { PageHeader };
