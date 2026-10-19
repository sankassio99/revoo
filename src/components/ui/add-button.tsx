import * as React from "react";
import { IconPlus } from "@tabler/icons-react";
import { Button, type ButtonProps } from "@/components/ui/button";

export type AddButtonProps = Omit<ButtonProps, "children" | "leftIcon" | "variant"> & {
  label?: string;
};

function AddButton({ label, ...props }: AddButtonProps) {
  return (
    <Button
      {...props}
      variant="accent"
      size={label ? "default" : "icon"}
      aria-label={label ? undefined : props["aria-label"] ?? "Adicionar"}
      leftIcon={<IconPlus aria-hidden="true" stroke={1.5} />}
      className={label ? `pl-3.5 pr-[18px] ${props.className ?? ""}` : props.className}
    >
      {label}
    </Button>
  );
}

export { AddButton };
