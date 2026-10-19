import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "cn";

export type HoursCardProps = {
  open: boolean;
  rows: { label: string; value: string }[];
  openLabel?: string;
  closedLabel?: string;
  className?: string;
};

function HoursCard({ open, rows, openLabel = "Aberto agora", closedLabel = "Fechado", className }: HoursCardProps) {
  return (
    <Card className={cn("rounded-card bg-ink p-[18px] text-white", className)}>
      <Badge tone={open ? "leaf" : "stone"}>{open ? openLabel : closedLabel}</Badge>
      <div className="mt-4 space-y-3">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex min-w-0 items-center justify-between gap-3 text-sm">
            <span className="truncate">{label}</span>
            <span className="shrink-0 text-ink-soft">{value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

export { HoursCard };
