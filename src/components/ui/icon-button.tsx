import * as React from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "cn";

export type IconButtonProps = Omit<ButtonProps, "children" | "size" | "variant"> & {
  icon: React.ReactNode;
  label: string;
  variant?: "surface" | "ink" | "brand";
  badge?: boolean;
};

function IconButton({ icon, label, variant = "surface", badge = false, className, ...props }: IconButtonProps) {
  const toneClass = {
    surface: "bg-surface text-ink hover:bg-stone-soft",
    ink: "bg-ink text-white hover:bg-ink/90",
    brand: "bg-brand text-white hover:bg-brand-hover",
  }[variant];

  return (
    <span className="relative inline-flex min-h-11 min-w-11 items-center justify-center">
      <Button
        {...props}
        size="icon"
        variant="ghost"
        aria-label={label}
        className={cn("size-10 min-h-10 after:absolute after:-inset-0.5 after:content-[''] [&_svg]:size-5", toneClass, className)}
      >
        {icon}
      </Button>
      {badge && <span className="pointer-events-none absolute right-1 top-1 size-2 rounded-full bg-danger" aria-hidden="true" />}
    </span>
  );
}

export { IconButton };
