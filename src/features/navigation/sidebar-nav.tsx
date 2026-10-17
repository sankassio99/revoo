"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  CaretDown,
} from "@phosphor-icons/react";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  navigationItems,
  type NavigationDestination,
} from "@/features/navigation/navigation-items";
import { resolveNavigation } from "@/features/navigation/navigation-match";
import { useLanguage } from "@/features/i18n/language-provider";
import { translate } from "@/lib/i18n/messages";

export function SidebarNav() {
  const pathname = usePathname();
  const { locale } = useLanguage();
  const match = resolveNavigation(pathname);
  const { isMobile, setOpenMobile } = useSidebar();
  const [collapsedSettingsPath, setCollapsedSettingsPath] = useState<string | null>(null);
  const [settingsManuallyExpanded, setSettingsManuallyExpanded] = useState(false);
  const settingsExpanded = match.activeGroup
    ? collapsedSettingsPath !== pathname
    : settingsManuallyExpanded;

  function toggleSettings() {
    if (settingsExpanded) {
      setCollapsedSettingsPath(match.activeGroup ? pathname : null);
      setSettingsManuallyExpanded(false);
    } else {
      setCollapsedSettingsPath(null);
      setSettingsManuallyExpanded(true);
    }
  }

  function closeMobileNavigation() {
    if (isMobile) {
      setOpenMobile(false);
    }
  }

  function renderDestination(item: NavigationDestination, nested = false) {
    const Icon = item.icon;
    const active = match.activeHref === item.href;

    if (nested) {
      return (
        <SidebarMenuSubButton
          aria-current={active ? "page" : undefined}
          isActive={active}
          key={item.href}
          className="text-white"
          onClick={closeMobileNavigation}
          render={<Link href={item.href} />}
        >
          <Icon aria-hidden="true" size={18} weight={active ? "fill" : "regular"} />
          <span>{translate(locale, item.label)}</span>
        </SidebarMenuSubButton>
      );
    }

    return (
      <SidebarMenuButton
        aria-current={active ? "page" : undefined}
        isActive={active}
        key={item.href}
        onClick={closeMobileNavigation}
        render={<Link href={item.href} />}
      >
        <Icon aria-hidden="true" size={18} weight={active ? "fill" : "regular"} />
        <span>{translate(locale, item.label)}</span>
      </SidebarMenuButton>
    );
  }

  return (
    <nav aria-label={translate(locale, "Workspace navigation")}>
      <SidebarGroup>
        <SidebarGroupLabel className="px-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-white/45">
          {translate(locale, "Workspace")}
        </SidebarGroupLabel>
        <SidebarMenu>
          {navigationItems.map((item) => {
            if (item.type === "link") {
              return (
                <SidebarMenuItem key={item.href} className="text-white">
                  {renderDestination(item)}
                </SidebarMenuItem>
              );
            }

            const Icon = item.icon;
            const active = match.activeGroup === item.id;

            return (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton
                  aria-controls="settings-navigation"
                  aria-expanded={settingsExpanded}
                  aria-label={translate(locale, item.label)}
                  isActive={active}
                  className="text-white"
                  onClick={toggleSettings}
                >
                  <Icon aria-hidden="true" size={18} weight={active ? "fill" : "regular"} />
                  <span>{translate(locale, item.label)}</span>
                  <CaretDown
                    aria-hidden="true"
                    className={`ml-auto transition-transform ${settingsExpanded ? "rotate-180" : ""}`}
                    size={14}
                  />
                </SidebarMenuButton>
                <SidebarMenuSub
                  id="settings-navigation"
                  hidden={!settingsExpanded}
                  aria-label={translate(locale, "Settings pages")}
                >
                  {item.items.map((child) => (
                    <SidebarMenuSubItem key={child.href} >
                      {renderDestination(child, true)}
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroup>
    </nav>
  );
}
