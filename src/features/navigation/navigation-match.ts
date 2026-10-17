import { navigationItems } from "@/features/navigation/navigation-items";

export type NavigationMatch = {
  activeHref: string | null;
  activeGroup: string | null;
};

function normalizePath(pathname: string) {
  if (pathname === "/") {
    return pathname;
  }

  return pathname.replace(/\/+$/, "");
}

function matchesRoute(pathname: string, href: string, section: boolean) {
  return pathname === href || (section && pathname.startsWith(`${href}/`));
}

export function resolveNavigation(pathname: string): NavigationMatch {
  const currentPath = normalizePath(pathname);

  for (const item of navigationItems) {
    if (item.type === "link" && matchesRoute(currentPath, item.href, item.match === "section")) {
      return { activeHref: item.href, activeGroup: null };
    }

    if (item.type === "group") {
      const activeChild = item.items.find((child) =>
        matchesRoute(currentPath, child.href, false),
      );
      if (activeChild) {
        return { activeHref: activeChild.href, activeGroup: item.id };
      }
    }
  }

  return { activeHref: null, activeGroup: null };
}
