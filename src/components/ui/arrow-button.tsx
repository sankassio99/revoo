import * as React from "react";
import { IconArrowUpRight } from "@tabler/icons-react";
import { cn } from "cn";

export type ArrowButtonProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  variant?: "plain" | "surface" | "leaf";
  decorative?: boolean;
};

function ArrowButton({ variant = "plain", decorative = false, className, ...props }: ArrowButtonProps) {
  const visualClassName = cn(
    "inline-flex size-10 min-h-11 min-w-11 items-center justify-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand [&_svg]:size-5 motion-reduce:transition-none",
    variant === "plain" && "bg-canvas text-ink",
    variant === "surface" && "bg-surface text-ink",
    variant === "leaf" && "bg-leaf text-leaf-deep",
    className
  );
  if (decorative) {
    return (
      <span className={visualClassName} aria-hidden="true">
        <IconArrowUpRight stroke={1.5} />
      </span>
    );
  }
  return (
    <button
      {...props}
      type={props.type ?? "button"}
      data-slot="arrow-button"
      tabIndex={props.tabIndex}
      aria-label={props["aria-label"] ?? "Abrir"}
      className={visualClassName}
    >
      <IconArrowUpRight aria-hidden="true" stroke={1.5} />
    </button>
  );
}

export { ArrowButton };
