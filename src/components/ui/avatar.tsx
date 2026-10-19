import * as React from "react";
import { cn } from "cn";
import { softTone, type Tone } from "@/components/ui/tones";

const avatarSizes = {
  32: "size-8 text-xs",
  40: "size-10 text-sm",
  48: "size-12 text-base",
  56: "size-14 text-lg",
} as const;

function initialsFor(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toLocaleUpperCase();
}

function toneForName(name: string): Tone {
  const tones: Tone[] = ["brand", "sun", "leaf", "stone"];
  const hash = [...name].reduce((value, char) => value + char.charCodeAt(0), 0);
  return tones[hash % tones.length] ?? "stone";
}

export type AvatarProps = React.ComponentProps<"span"> & {
  name?: string;
  src?: string;
  size?: 32 | 40 | 48 | 56;
  tone?: Tone;
};

function Avatar({ className, name = "", src, size = 40, tone, children, ...props }: AvatarProps) {
  return (
    <span
      data-slot="avatar"
      className={cn("relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-medium", avatarSizes[size], softTone[tone ?? toneForName(name)], className)}
      {...props}
    >
      {children ?? (src
        ? <AvatarImage src={src} alt={name} />
        : <AvatarFallback>{initialsFor(name)}</AvatarFallback>)}
    </span>
  );
}

function AvatarImage({ className, alt = "", ...props }: React.ComponentProps<"img">) {
  return <img data-slot="avatar-image" className={cn("absolute inset-0 size-full object-cover", className)} alt={alt} {...props} />;
}

function AvatarFallback({ className, ...props }: React.ComponentProps<"span">) {
  return <span data-slot="avatar-fallback" className={cn("inline-flex size-full items-center justify-center font-medium", className)} {...props} />;
}

export { Avatar, AvatarImage, AvatarFallback };
