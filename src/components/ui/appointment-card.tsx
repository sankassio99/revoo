import * as React from "react";
import { IconDots } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import { categoryTone, solidTone, type AppointmentStatus, type ServiceCategory } from "@/components/ui/tones";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "cn";

export type AppointmentCardProps = {
  client: string;
  service: string;
  professional: string;
  time: string;
  phone?: string;
  status: AppointmentStatus;
  category: ServiceCategory;
  onConfirm?: () => void;
  onMore?: (action: "remarcar" | "cancelar" | "falta") => void;
  className?: string;
};

function AppointmentCard({ client, service, professional, time, status, category, onConfirm, onMore, className }: AppointmentCardProps) {
  const tone = solidTone[categoryTone[category]];
  const isDark = categoryTone[category] === "ink" || categoryTone[category] === "brand";
  return (
    <div className="min-w-0">
      <time className="mb-2 block font-mono text-[14px] leading-[1.5] text-muted">{time}</time>
      <article className={cn("rounded-card p-4", tone.bg, tone.fg, className)}>
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-heading">{client}</h3>
            <p className={cn("mt-1 truncate text-[13px]", tone.sub)}>{service} · {professional}</p>
          </div>
          <StatusPill status={status} onSolid />
        </div>
        <div className="mt-3.5 flex items-center gap-2">
          {status === "agendado" && <Button size="sm" variant={isDark ? "secondary" : "default"} onClick={onConfirm}>Confirmar</Button>}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button size="icon" variant="secondary" aria-label="Mais ações da marcação"><IconDots stroke={1.5} /></Button>}
            />
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onMore?.("remarcar")}>Remarcar</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onMore?.("cancelar")}>Cancelar</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onMore?.("falta")}>Marcar falta</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </article>
    </div>
  );
}

export { AppointmentCard };
