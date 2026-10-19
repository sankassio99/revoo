import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { softTone, type Tone } from "@/components/ui/tones";

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full px-2.5 py-0.5 text-caption font-normal whitespace-nowrap",
  {
    variants: {
      variant: {
        default: softTone.ink,
        secondary: softTone.stone,
        destructive: softTone.danger,
        outline: "border border-line bg-surface text-ink",
        brand: softTone.brand,
        leaf: softTone.leaf,
        sun: softTone.sun,
        ink: softTone.ink,
        stone: softTone.stone,
        danger: softTone.danger,
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export type BadgeProps = React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { tone?: Tone };

function Badge({ className, variant, tone, ...props }: BadgeProps) {
  const mappedVariant = tone ?? variant;
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant: mappedVariant, className }))}
      {...props}
    />
  );
}

const Tag = Badge;

export { Badge, Tag, badgeVariants };
