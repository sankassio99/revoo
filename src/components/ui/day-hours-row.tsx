import * as React from "react";
import { IconPencil } from "@tabler/icons-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "cn";

export type DayHoursRowProps = { label: string; open: boolean; from?: string; to?: string; onToggle: (open: boolean) => void; onEdit?: () => void; className?: string };

function DayHoursRow({ label, open, from, to, onToggle, onEdit, className }: DayHoursRowProps) {
  const hours = open ? [from, to].filter(Boolean).join(" às ") : "Fechado";
  return (
    <div className={cn("flex min-h-[68px] items-center gap-3 border-b border-line/60 px-4 py-3 last:border-b-0", className)}>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px]">{label}</p>
        <p className="text-[13px] text-muted">{hours || "Horário por definir"}</p>
      </div>
      {onEdit && <button type="button" onClick={onEdit} aria-label={`Editar horário de ${label}`} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-muted focus-visible:outline-2 focus-visible:outline-brand"><IconPencil size={18} stroke={1.5} /></button>}
      <Switch checked={open} onCheckedChange={onToggle} label={`${open ? "Fechar" : "Abrir"} ${label}`} />
    </div>
  );
}

export { DayHoursRow };
