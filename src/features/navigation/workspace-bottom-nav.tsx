"use client";

import { usePathname } from "next/navigation";
import { BottomNav, type BottomNavItem } from "@/components/ui/bottom-nav";

export function WorkspaceBottomNav({ items }: { items: BottomNavItem[] }) {
  const pathname = usePathname();
  const match = items
    .filter(({ href }) => (href === "/workspace" ? pathname === href : pathname.startsWith(href)))
    .sort((a, b) => b.href.length - a.href.length)[0];

  return <BottomNav activeKey={match?.key ?? ""} items={items} />;
}
