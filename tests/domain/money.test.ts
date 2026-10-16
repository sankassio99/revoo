import { describe, expect, it } from "vitest";
import { formatMinorUnits, toMinorUnits } from "@/lib/domain/money";

describe("money helpers", () => {
  it("converts amounts to integer minor units", () => {
    expect(toMinorUnits(18.45, "EUR")).toBe(1845);
  });

  it("rejects invalid amounts and currency codes", () => {
    expect(() => toMinorUnits(-1, "EUR")).toThrow();
    expect(() => toMinorUnits(Number.NaN, "EUR")).toThrow();
    expect(() => toMinorUnits(1, "EURO")).toThrow();
    expect(() => toMinorUnits(Number.MAX_SAFE_INTEGER, "EUR")).toThrow();
  });

  it("formats minor units as currency", () => {
    expect(formatMinorUnits(1845, "EUR")).toContain("18.45");
  });

  it("rejects non-integer or unsafe minor units", () => {
    expect(() => formatMinorUnits(1.5, "EUR")).toThrow();
    expect(() => formatMinorUnits(Number.MAX_SAFE_INTEGER + 1, "EUR")).toThrow();
  });
});
