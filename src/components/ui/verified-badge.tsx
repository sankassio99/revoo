import { IconRosetteDiscountCheck } from "@tabler/icons-react";

export type VerifiedBadgeProps = { className?: string };

function VerifiedBadge({ className }: VerifiedBadgeProps) {
  return <IconRosetteDiscountCheck aria-label="Verificado" className={className} size={26} stroke={1.5} />;
}

export { VerifiedBadge };
