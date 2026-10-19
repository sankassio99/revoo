import * as React from "react";
import { cn } from "cn";
import { softTone, type Tone } from "@/components/ui/tones";

export type IconCircleProps = {
  icon: React.ReactNode;
  tone: Tone;
  size?: 40 | 48;
  className?: string;
};

function IconCircle({ icon, tone, size = 48, className }: IconCircleProps) {
  return (
    <span className={cn("inline-flex shrink-0 items-center justify-center rounded-full [&_svg]:size-5 [&_svg]:stroke-[1.5]", size === 40 ? "size-10" : "size-12 [&_svg]:size-[22px]", softTone[tone], className)} aria-hidden="true">
      {icon}
    </span>
  );
}

export { IconCircle };
