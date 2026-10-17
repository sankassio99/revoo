import { describe, expect, it } from "vitest";
import { parseAcceptLanguage, resolveLocale } from "@/lib/i18n/locale";
import { formatCurrency, formatDate, formatNumber } from "@/lib/i18n/format";
import { messages, translate } from "@/lib/i18n/messages";

describe("resolveLocale", () => {
  it("prefers an explicit supported selection", () => {
    expect(resolveLocale("pt", ["en-US"])).toBe("pt");
    expect(resolveLocale("en", ["pt-BR"])).toBe("en");
  });

  it.each([
    ["pt", "pt"],
    ["pt-BR", "pt"],
    ["pt-PT", "pt"],
    ["en", "en"],
    ["en-US", "en"],
    ["en-GB", "en"],
  ])("maps browser language %s to %s", (browserLanguage, expected) => {
    expect(resolveLocale(undefined, [browserLanguage])).toBe(expected);
  });

  it("uses the first supported browser preference", () => {
    expect(resolveLocale(undefined, ["fr-FR", "pt-BR", "en-US"])).toBe("pt");
    expect(resolveLocale(undefined, ["fr-FR", "en-GB", "pt-PT"])).toBe("en");
  });

  it("falls back to English for unsupported or missing preferences", () => {
    expect(resolveLocale(undefined, ["fr-FR", "es-ES"])).toBe("en");
    expect(resolveLocale(undefined, [])).toBe("en");
  });

  it("ignores invalid explicit values and resolves the browser preference", () => {
    expect(resolveLocale("fr", ["pt-BR"])).toBe("pt");
    expect(resolveLocale("pt-BR", ["en-US"])).toBe("en");
  });

  it("sorts Accept-Language values by quality and ignores invalid qualities", () => {
    expect(parseAcceptLanguage("fr;q=0.4, pt-BR;q=1, en-US;q=0.8, es;q=0")).toEqual([
      "pt-BR",
      "en-US",
      "fr",
    ]);
    expect(parseAcceptLanguage(null)).toEqual([]);
  });
});

describe("internationalized messages and formatting", () => {
  it("provides matching translated home-page message keys", () => {
    const messageKeys = (value: unknown, prefix = ""): string[] => {
      if (Array.isArray(value)) {
        return value.flatMap((item, index) => messageKeys(item, `${prefix}.${index}`));
      }
      if (typeof value !== "object" || value === null) return [prefix];

      return Object.entries(value).flatMap(([key, child]) =>
        messageKeys(child, prefix ? `${prefix}.${key}` : key),
      );
    };

    expect(messageKeys(messages.en)).toEqual(messageKeys(messages.pt));
    expect(messages.en.home.highlights).toHaveLength(messages.pt.home.highlights.length);
  });

  it("translates message templates while preserving inserted business and status values", () => {
    expect(translate("pt", "Appointments with Alex will be kept here.")).toBe(
      "Os compromissos de Alex serão guardados aqui.",
    );
    expect(
      translate("pt", "Cannot change an appointment from Scheduled to NoShow."),
    ).toBe("Não é possível alterar um compromisso de Marcado para Falta.");
  });

  it("formats numbers and dates according to the selected locale", () => {
    expect(formatNumber(1234.5, "en")).toBe("1,234.5");
    expect(formatNumber(1234.5, "pt")).toBe("1.234,5");
    expect(formatDate(new Date("2025-01-15T00:00:00.000Z"), "en", {
      timeZone: "UTC",
      dateStyle: "short",
    })).not.toBe(formatDate(new Date("2025-01-15T00:00:00.000Z"), "pt", {
      timeZone: "UTC",
      dateStyle: "short",
    }));
  });

  it("formats currency with the caller-supplied currency code", () => {
    expect(formatCurrency(18.45, "EUR", "en")).toContain("€");
    expect(formatCurrency(18.45, "EUR", "pt")).toContain("€");
    expect(() => formatCurrency(18.45, "NOT-CURRENCY", "en")).toThrow();
  });
});
