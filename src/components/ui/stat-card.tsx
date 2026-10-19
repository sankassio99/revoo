import Link from "next/link";
import * as React from "react";
import { ArrowButton } from "@/components/ui/arrow-button";
import { solidTone, type Tone } from "@/components/ui/tones";
import { cn } from "cn";

export type StatCardProps = { label: string; value: string | number; caption?: string; tone: Tone; href?: string; icon?: React.ReactNode; className?: string };

function StatCard({ label, value, caption, tone, href, icon, className }: StatCardProps) {
  const colors = solidTone[tone];
  const content = (
    <div className={cn("flex min-h-[112px] flex-col justify-between rounded-card p-4", colors.bg, colors.fg, icon && "min-h-[128px]", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className={cn("text-caption tracking-[0.04em]", colors.sub)}>{label}</p>
        {icon && <ArrowButton variant="leaf" decorative className="size-8 min-h-8 min-w-8 [&_svg]:size-4" />}
      </div>
      <p className={cn(icon ? "text-xl tracking-[-0.02em]" : "text-[34px] leading-none tracking-[-0.03em]")}>{value}</p>
      {caption && <p className={cn("text-caption", colors.sub)}>{caption}</p>}
    </div>
  );
  return href ? <Link href={href} className="block rounded-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand" aria-label={`${label}: ${value}`}>{content}</Link> : content;
}

export { StatCard };
