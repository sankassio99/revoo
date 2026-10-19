import * as React from "react";
import { IconStar } from "@tabler/icons-react";
import { cn } from "cn";

export type RatingStarsProps = { value: number; count?: number; className?: string };

function RatingStars({ value, count, className }: RatingStarsProps) {
  const clampedValue = Math.max(0, Math.min(5, value));
  const label = `Nota ${clampedValue.toFixed(1)} em 5${count === undefined ? "" : `, ${count} avaliações`}`;
  return (
    <div className={cn("inline-flex min-h-11 items-center gap-2", className)} aria-label={label}>
      <span aria-hidden="true" className="text-lg font-medium">{clampedValue.toFixed(1)}</span>
      <span aria-hidden="true" className="relative inline-flex text-sun">
        <span className="inline-flex">{Array.from({ length: 5 }, (_, index) => <IconStar key={index} size={16} stroke={1.5} />)}</span>
        <span className="absolute inset-y-0 left-0 inline-flex overflow-hidden text-sun" style={{ width: `${clampedValue / 5 * 100}%` }}>
          {Array.from({ length: 5 }, (_, index) => <IconStar key={index} size={16} fill="currentColor" stroke={1.5} />)}
        </span>
      </span>
      {count !== undefined && <span aria-hidden="true" className="text-caption text-muted">({count} avaliações)</span>}
    </div>
  );
}

export { RatingStars };
