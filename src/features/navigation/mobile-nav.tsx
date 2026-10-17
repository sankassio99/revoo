"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { useLanguage } from "@/features/i18n/language-provider";
import { translate } from "@/lib/i18n/messages";

export function MobileNav() {
  const { locale } = useLanguage();

  return (
    <SidebarTrigger
      aria-label={translate(locale, "Toggle workspace navigation")}
      className="md:hidden"
    />
  );
}
