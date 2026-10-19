"use client";

import { Switch as SwitchPrimitive } from "@base-ui/react/switch";
import { cn } from "cn";

export type SwitchProps = SwitchPrimitive.Root.Props & {
  label?: string;
  tone?: "brand" | "ink";
};

function Switch({ className, label, tone = "brand", ...props }: SwitchProps) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      aria-label={label}
      className={cn(
        "relative inline-flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center rounded-full p-[3px] outline-none after:pointer-events-none after:absolute after:inset-y-0 after:-inset-x-1/2 before:absolute before:left-0 before:top-1/2 before:h-[26px] before:w-11 before:-translate-y-1/2 before:rounded-full before:bg-off before:content-[''] data-checked:before:bg-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50",
        tone === "ink" && "data-checked:before:bg-ink",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none relative z-[1] size-5 rounded-full bg-white transition-transform duration-150 data-checked:translate-x-[18px] motion-reduce:transition-none"
      />
    </SwitchPrimitive.Root>
  );
}

const Toggle = Switch;

export { Switch, Toggle };
