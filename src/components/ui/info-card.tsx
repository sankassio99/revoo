import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "cn";

export type InfoCardProps = { eyebrow?: string; title: string; body?: string; className?: string };

function InfoCard({ eyebrow, title, body, className }: InfoCardProps) {
  return (
    <Card className={cn("rounded-card bg-ink p-[18px] text-white", className)}>
      {eyebrow && <Badge tone="leaf" className="mb-3">{eyebrow}</Badge>}
      <h3 className="text-[23px] leading-tight tracking-[-0.02em]">{title}</h3>
      {body && <p className="mt-2 text-[14px] leading-[1.5] text-ink-soft">{body}</p>}
    </Card>
  );
}

export { InfoCard };
