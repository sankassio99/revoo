"use client";

import Link from "next/link";
import * as React from "react";
import { cn } from "cn";

export type BottomNavItem = { key: string; label: string; icon: React.ReactNode; href: string };
export type BottomNavProps = { items: BottomNavItem[]; activeKey: string; static?: boolean; className?: string };

function BottomNav({ items, activeKey, static: isStatic = false, className }: BottomNavProps) {
  return (
    <div className={cn(isStatic ? "relative px-4 pb-4" : "fixed inset-x-0 bottom-0 z-40 px-4 md:hidden pb-[max(16px,env(safe-area-inset-bottom))]", className)}>
      <nav aria-label="Principal" className="mx-auto w-full max-w-md rounded-full bg-ink p-1.5">
        <ul className="flex items-center justify-between">
          {items.map(({ key, label, icon, href }) => {
            const active = key === activeKey;
            return (
              <li key={key}>
                <Link
                  href={href}
                  aria-label={label}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-12 min-w-12 items-center justify-center gap-2 rounded-full text-ink-soft transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white [&_svg]:size-[22px]",
                    active && "bg-brand px-4 text-white"
                  )}
                >
                  {icon}
                  {active && <span className="text-sm">{label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

export { BottomNav };
