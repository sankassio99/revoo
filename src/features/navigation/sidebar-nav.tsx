"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  CalendarDots,
  ChartLineUp,
  GearSix,
  House,
  UsersThree,
} from "@phosphor-icons/react";

const items = [
  { href: "/workspace", label: "Overview", icon: House, exact: true },
  { href: "/workspace/appointments", label: "Appointments", icon: CalendarDots },
  { href: "/workspace/customers", label: "Customers", icon: UsersThree },
  { href: "/workspace/settings", label: "Business settings", icon: GearSix },
  { href: "/workspace/reports", label: "Reports", icon: ChartLineUp },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Workspace navigation" className="space-y-1">
      {items.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;

        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={`relative flex min-h-11 items-center gap-3 rounded-xl px-3.5 text-[13px] transition-colors duration-200 ${
              active ? "text-white" : "text-white/60 hover:bg-white/6 hover:text-white/90"
            }`}
            href={item.href}
            key={item.href}
          >
            {active && (
              <motion.span
                className="absolute inset-0 rounded-xl bg-white/10"
                initial={false}
                layoutId="active-navigation-item"
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
              />
            )}
            <Icon className="relative z-[1]" size={18} weight={active ? "fill" : "regular"} />
            <span className="relative z-[1]">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
