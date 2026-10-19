import { Badge } from "@/components/ui/badge";
import { statusTone, type AppointmentStatus } from "@/components/ui/tones";
import { cn } from "cn";

export type StatusPillProps = { status: AppointmentStatus; onSolid?: boolean; className?: string };

function StatusPill({ status, onSolid = false, className }: StatusPillProps) {
  const { label, tone } = statusTone[status];
  return <Badge tone={onSolid ? undefined : tone} variant={onSolid ? "secondary" : undefined} className={cn(onSolid && "bg-white text-ink", className)}>{label}</Badge>;
}

export { StatusPill };
