import * as React from "react";
import { IconClock } from "@tabler/icons-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { solidTone, categoryTone, type ServiceCategory, type Tone } from "@/components/ui/tones";
import { cn } from "cn";

export type ProfessionalCardProps = {
  name: string;
  role: string;
  specialties: { label: string; category: ServiceCategory }[];
  schedule: string;
  active: boolean;
  onToggle: (active: boolean) => void;
  tone?: Tone;
  className?: string;
};

function ProfessionalCard({ name, role, specialties, schedule, active, onToggle, tone, className }: ProfessionalCardProps) {
  const colors = tone && active ? solidTone[tone] : null;
  return (
    <article className={cn("rounded-card bg-surface p-4", colors?.bg, colors?.fg, className)}>
      <div className="flex items-center gap-3">
        <Avatar name={name} size={56} tone={tone} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg">{name}</h3>
          <p className={cn("truncate text-[13px]", colors?.sub ?? "text-muted")}>{role}</p>
        </div>
        <Switch checked={active} onCheckedChange={onToggle} label={`Ativar ${name}`} tone={tone === "leaf" ? "ink" : "brand"} />
      </div>
      {specialties.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{specialties.map(({ label, category }) => <Badge key={label} tone={categoryTone[category]} className="bg-white">{label}</Badge>)}</div>}
      <p className={cn("mt-3 flex items-center gap-2 text-[13px]", colors?.sub ?? "text-muted")}>
        <IconClock size={16} stroke={1.5} />
        {active ? schedule : schedule}
      </p>
    </article>
  );
}

export { ProfessionalCard };
