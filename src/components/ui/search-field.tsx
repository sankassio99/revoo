"use client";

import * as React from "react";
import { IconSearch, IconX } from "@tabler/icons-react";
import { Input } from "@/components/ui/input";
import { cn } from "cn";

export type SearchFieldProps = Omit<React.ComponentProps<"input">, "type"> & { onClear?: () => void; containerClassName?: string };

const SearchField = React.forwardRef<HTMLInputElement, SearchFieldProps>(function SearchField({ className, containerClassName, onClear, value, defaultValue, onChange, ...props }, ref) {
  const [internalValue, setInternalValue] = React.useState(String(defaultValue ?? ""));
  const currentValue = value === undefined ? internalValue : String(value);
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (value === undefined) setInternalValue(event.target.value);
    onChange?.(event);
  };
  const clear = () => {
    if (value === undefined) setInternalValue("");
    onClear?.();
  };
  return (
    <div role="search" className={cn("flex h-11 min-w-0 items-center gap-3 rounded-full bg-surface px-4 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand", containerClassName)}>
      <IconSearch aria-hidden="true" className="size-[18px] shrink-0 text-muted" stroke={1.5} />
      <Input {...props} ref={ref} type="search" value={currentValue} onChange={handleChange} className={cn("h-full min-w-0 flex-1 rounded-none border-0 bg-transparent px-0 py-0 focus-visible:outline-none", className)} />
      {currentValue && <button type="button" onClick={clear} aria-label="Limpar pesquisa" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-muted focus-visible:outline-2 focus-visible:outline-brand">
        <IconX aria-hidden="true" size={18} stroke={1.5} />
      </button>}
    </div>
  );
});

SearchField.displayName = "SearchField";

export { SearchField };
