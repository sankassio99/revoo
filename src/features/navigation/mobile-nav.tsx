"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";

export function MobileNav() {
  return (
    <SidebarTrigger
      aria-label="Toggle workspace navigation"
      className="md:hidden"
    />
  );
}
