"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDots, GearSix, House, UsersThree } from "@phosphor-icons/react";

const items = [
  { href: "/workspace", label: "Home", icon: House, exact: true },
  { href: "/workspace/appointments", label: "Calendar", icon: CalendarDots },
  { href: "/workspace/customers", label: "People", icon: UsersThree },
  { href: "/workspace/settings", label: "Settings", icon: GearSix },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Mobile workspace navigation"
      className="fixed inset-x-0 bottom-0 z-[2] grid grid-cols-4 border-t border-line bg-paper/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-lg lg:hidden"
    >
      {items.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;

        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={`flex min-h-12 flex-col items-center justify-center gap-1 text-[9px] font-medium transition-colors ${
              active ? "text-forest" : "text-muted hover:text-forest"
            }`}
            href={item.href}
            key={item.href}
          >
            <Icon size={17} weight={active ? "fill" : "regular"} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
