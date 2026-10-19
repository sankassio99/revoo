"use client";

import * as React from "react";
import { IconSparkles } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { cn } from "cn";

export type LogoUploaderProps = { src?: string; onChange: (file: File) => void; maxSizeMb?: number; className?: string };

function LogoUploader({ src, onChange, maxSizeMb = 2, className }: LogoUploaderProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [error, setError] = React.useState("");
  const selectFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/png", "image/jpeg"].includes(file.type)) {
      setError("Escolha uma imagem PNG ou JPG.");
      event.target.value = "";
      return;
    }
    if (file.size > maxSizeMb * 1024 * 1024) {
      setError(`O ficheiro deve ter até ${maxSizeMb} MB.`);
      event.target.value = "";
      return;
    }
    setError("");
    onChange(file);
  };
  return (
    <div className={cn("rounded-card bg-surface p-3.5", className)}>
      <div className="flex items-center gap-3">
        <span className="inline-flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-ink text-white">
          {src ? <img src={src} alt="Logótipo atual" className="size-full object-cover" /> : <IconSparkles aria-hidden="true" size={24} stroke={1.5} />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-base">Logo</p>
          <p className="text-caption text-muted">PNG ou JPG, até {maxSizeMb} MB</p>
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={() => inputRef.current?.click()}>Alterar</Button>
        <input ref={inputRef} hidden type="file" accept="image/png,image/jpeg" onChange={selectFile} aria-label="Selecionar logótipo" />
      </div>
      {error && <p role="status" aria-live="polite" className="mt-2 text-caption text-danger-deep">{error}</p>}
    </div>
  );
}

export { LogoUploader };
