"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "cn";

export type SelectFieldProps = {
  label: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string | null) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
};

function SelectField({ label, value, defaultValue, onValueChange, options, placeholder, error, disabled, className }: SelectFieldProps) {
  const id = React.useId();
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className={cn("min-w-0", className)}>
      <Label htmlFor={id} className="text-caption text-muted">{label}</Label>
      <div className={cn("mt-1 rounded-field bg-surface focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand", error && "outline-2 outline-danger")}>
        <Select value={value} defaultValue={defaultValue} onValueChange={onValueChange} disabled={disabled}>
          <SelectTrigger id={id} aria-invalid={Boolean(error)} aria-describedby={errorId}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {error && <p id={errorId} className="mt-1 text-caption text-danger-deep">{error}</p>}
    </div>
  );
}

export { SelectField };
