import Link from "next/link";
import { IconChevronRight } from "@tabler/icons-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "cn";

export type ClientCardProps = { name: string; phone?: string; lastVisit?: string; topService?: string; visits?: number; todayAt?: string; href: string; className?: string };

function ClientCard({ name, phone, lastVisit, topService, visits, todayAt, href, className }: ClientCardProps) {
  return (
    <Link href={href} className={cn("flex min-h-11 min-w-0 items-center gap-3 rounded-card bg-surface p-3 text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand", className)}>
      <Avatar name={name} size={48} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-base">{name}</span>
        <span className="block truncate text-caption text-muted">{phone ?? (lastVisit ? `Última visita: ${lastVisit}` : "Cliente")}</span>
        {topService && <Badge className="mt-1">{topService}</Badge>}
      </span>
      <span className="flex shrink-0 items-center gap-1 text-caption text-muted">
        {todayAt ?? (visits !== undefined ? `${visits} visitas` : "")}
        <IconChevronRight aria-hidden="true" size={18} stroke={1.5} />
      </span>
    </Link>
  );
}

export { ClientCard };
