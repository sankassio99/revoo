import Link from "next/link";
import * as React from "react";
import { IconDroplet, IconRazor, IconScissors } from "@tabler/icons-react";
import { IconCircle } from "@/components/ui/icon-circle";
import { categoryTone, type ServiceCategory } from "@/components/ui/tones";
import { cn } from "cn";

export type ServiceRowProps = { name: string; duration: string | number; price: number; category: ServiceCategory; href?: string; className?: string };

function ServiceRow({ name, duration, price, category, href, className }: ServiceRowProps) {
  const icon = category === "barba" || category === "combo" ? <IconRazor /> : category === "coloracao" ? <IconDroplet /> : <IconScissors />;
  const content = (
    <span className={cn("flex min-h-11 min-w-0 items-center gap-3 rounded-full bg-surface p-2 text-ink", className)}>
      <IconCircle icon={icon} tone={categoryTone[category]} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-base">{name}</span>
        <span className="block truncate text-caption text-muted">{typeof duration === "number" ? `${duration} min` : duration}</span>
      </span>
      <span className="shrink-0 pr-3 text-base">{new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(price)}</span>
    </span>
  );
  return href ? <Link href={href} className="block rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">{content}</Link> : content;
}

export { ServiceRow };
