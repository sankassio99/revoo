"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

export function AppFrameTopbar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/workspace") return null;
  return children;
}
