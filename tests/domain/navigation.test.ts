import { describe, expect, it } from "vitest";
import { resolveNavigation } from "@/features/navigation/navigation-match";

describe("resolveNavigation", () => {
  it("matches Overview only at the workspace root", () => {
    expect(resolveNavigation("/workspace")).toEqual({
      activeHref: "/workspace",
      activeGroup: null,
    });
    expect(resolveNavigation("/workspace/unknown")).toEqual({
      activeHref: null,
      activeGroup: null,
    });
  });

  it("keeps Customers active on a customer detail route", () => {
    expect(resolveNavigation("/workspace/customers/customer-123")).toEqual({
      activeHref: "/workspace/customers",
      activeGroup: null,
    });
  });

  it("normalizes trailing slashes before matching", () => {
    expect(resolveNavigation("/workspace/customers/")).toEqual({
      activeHref: "/workspace/customers",
      activeGroup: null,
    });
  });

  it.each([
    ["/workspace/settings", "/workspace/settings"],
    ["/workspace/settings/catalog", "/workspace/settings/catalog"],
    ["/workspace/settings/team", "/workspace/settings/team"],
  ])("marks the matching Settings destination active at %s", (pathname, activeHref) => {
    expect(resolveNavigation(pathname)).toEqual({
      activeHref,
      activeGroup: "settings",
    });
  });

  it("does not mark Settings active for an unknown child route", () => {
    expect(resolveNavigation("/workspace/settings/unknown")).toEqual({
      activeHref: null,
      activeGroup: null,
    });
  });
});
