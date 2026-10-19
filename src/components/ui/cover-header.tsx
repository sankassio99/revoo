import Link from "next/link";
import * as React from "react";
import { Avatar } from "@/components/ui/avatar";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { cn } from "cn";

export type CoverAction = { key: string; icon: React.ReactNode; label: string; href: string };
export type CoverHeaderProps = {
  name: string;
  tagline?: string;
  verified?: boolean;
  logoSrc?: string;
  actions: CoverAction[];
  storeHref?: string;
  coverSrc?: string;
  className?: string;
};

function CoverHeader({ name, tagline, verified = false, logoSrc, actions, storeHref, coverSrc, className }: CoverHeaderProps) {
  return (
    <section className={cn("min-w-0", className)}>
      <div className="relative h-[210px] overflow-hidden rounded-sheet bg-brand">
        {coverSrc ? (
          <img src={coverSrc} alt="" className="absolute inset-0 size-full object-cover" />
        ) : (
          <>
            <span className="absolute -right-10 -top-16 size-56 rounded-full bg-brand-hover" />
            <span className="absolute -bottom-16 left-8 size-40 rounded-full bg-leaf" />
            <span className="absolute right-20 top-24 size-20 rounded-full bg-sun" />
          </>
        )}
        <div className="absolute right-3 top-3 flex gap-1">
          {actions.map(({ key, icon, label, href }) => (
            <Link href={href} key={key} aria-label={label} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-surface text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand [&_svg]:size-5">
              {icon}
            </Link>
          ))}
        </div>
        {storeHref && <Link href={storeHref} className="absolute bottom-3 right-3 inline-flex min-h-11 items-center rounded-full bg-surface px-4 text-sm text-ink">Loja</Link>}
      </div>
      <div className="-mt-9 ml-3.5">
        <Avatar name={name} src={logoSrc} size={56} className="size-[84px] border-4 border-canvas text-2xl" />
      </div>
      <div className="mt-3 min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <h1 className="truncate text-display">{name}</h1>
          {verified && <VerifiedBadge className="shrink-0 text-brand" />}
        </div>
        {tagline && <p className="mt-1 text-base text-muted">{tagline}</p>}
      </div>
    </section>
  );
}

export { CoverHeader };
