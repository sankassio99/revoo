import { CalendarDots } from "@phosphor-icons/react/dist/csr/CalendarDots";
import { ChartLineUp } from "@phosphor-icons/react/dist/csr/ChartLineUp";
import { ChatCircleDots } from "@phosphor-icons/react/dist/csr/ChatCircleDots";
import { GearSix } from "@phosphor-icons/react/dist/csr/GearSix";
import { House } from "@phosphor-icons/react/dist/csr/House";
import { Package } from "@phosphor-icons/react/dist/csr/Package";
import { UsersThree } from "@phosphor-icons/react/dist/csr/UsersThree";

export const navigationItems = [
  {
    type: "link",
    href: "/workspace",
    label: "Overview",
    icon: House,
    match: "exact",
  },
  {
    type: "link",
    href: "/workspace/appointments",
    label: "Appointments",
    icon: CalendarDots,
    match: "exact",
  },
  {
    type: "link",
    href: "/workspace/customers",
    label: "Customers",
    icon: UsersThree,
    match: "section",
  },
  {
    type: "link",
    href: "/workspace/follow-up",
    label: "Follow-up",
    icon: ChatCircleDots,
    match: "exact",
  },
  {
    type: "link",
    href: "/workspace/reports",
    label: "Reports",
    icon: ChartLineUp,
    match: "exact",
  },
  {
    type: "group",
    id: "settings",
    label: "Settings",
    icon: GearSix,
    items: [
      {
        href: "/workspace/settings",
        label: "Business",
        icon: GearSix,
      },
      {
        href: "/workspace/settings/catalog",
        label: "Catalog",
        icon: Package,
      },
      {
        href: "/workspace/settings/team",
        label: "Team",
        icon: UsersThree,
      },
    ],
  },
] as const;

export type NavigationItem = (typeof navigationItems)[number];
export type NavigationLink = Extract<NavigationItem, { type: "link" }>;
export type NavigationGroup = Extract<NavigationItem, { type: "group" }>;
export type NavigationDestination =
  | NavigationLink
  | NavigationGroup["items"][number];
