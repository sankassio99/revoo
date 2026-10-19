import Link from "next/link";
import * as React from "react";
import { ArrowButton } from "@/components/ui/arrow-button";
import { IconCircle } from "@/components/ui/icon-circle";
import { type Tone } from "@/components/ui/tones";
import { cn } from "cn";

export type ListRowProps = { icon: React.ReactNode; tone: Tone; title: string; subtitle?: string; href: string; className?: string };

function ListRow({ icon, tone, title, subtitle, href, className }: ListRowProps) {
  return (
    <Link href={href} className={cn("flex min-h-11 min-w-0 items-center gap-3 rounded-full bg-surface p-2 text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand", className)}>
      <IconCircle icon={icon} tone={tone} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-base">{title}</span>
        {subtitle && <span className="block truncate text-caption text-muted">{subtitle}</span>}
      </span>
      <ArrowButton decorative variant="plain" />
    </Link>
  );
}

export { ListRow };
