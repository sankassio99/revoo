"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "cn";

export type TextFieldProps = React.ComponentProps<"input"> & { label: string; error?: string };

const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(function TextField({ label, error, id, className, ...props }, ref) {
  const generatedId = React.useId();
  const inputId = id ?? generatedId;
  const errorId = error ? `${inputId}-error` : undefined;
  return (
    <div className="min-w-0">
      <label htmlFor={inputId} className="block text-caption text-muted">{label}</label>
      <div className={cn("mt-1 rounded-field bg-surface px-4 py-2.5 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand", error && "outline-2 outline-danger")}>
        <Input
          {...props}
          ref={ref}
          id={inputId}
          aria-invalid={Boolean(error) || props["aria-invalid"]}
          aria-describedby={errorId ?? props["aria-describedby"]}
          className={cn("h-6 rounded-none bg-transparent px-0 py-0 text-[15px] focus-visible:outline-none", className)}
        />
      </div>
      {error && <p id={errorId} className="mt-1 text-caption text-danger-deep">{error}</p>}
    </div>
  );
});

TextField.displayName = "TextField";

export { TextField };
