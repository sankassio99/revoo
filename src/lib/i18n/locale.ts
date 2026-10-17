export const supportedLocales = ["en", "pt"] as const;
export const languagePreferenceCookie = "revoo-locale";

export type Locale = (typeof supportedLocales)[number];

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && supportedLocales.includes(value as Locale);
}

function localeFromLanguageTag(languageTag: string): Locale | undefined {
  const language = /^([a-z]{2,3})(?:-|$)/i.exec(languageTag.trim())?.[1]?.toLowerCase();
  return language === "en" || language === "pt" ? language : undefined;
}

export function resolveLocale(
  explicitLocale: unknown,
  browserLanguages: readonly string[],
): Locale {
  if (isLocale(explicitLocale)) return explicitLocale;

  for (const language of browserLanguages) {
    const locale = localeFromLanguageTag(language);
    if (locale) return locale;
  }

  return "en";
}

export function parseAcceptLanguage(header: string | null): string[] {
  if (!header) return [];

  return header
    .split(",")
    .map((entry, index) => {
      const [languageTag, ...parameters] = entry.trim().split(";");
      const qualityParameter = parameters.find((parameter) =>
        parameter.trim().startsWith("q="),
      );
      const quality = qualityParameter
        ? Number(qualityParameter.trim().slice(2))
        : 1;

      return {
        languageTag: languageTag?.trim() ?? "",
        quality: Number.isFinite(quality) && quality > 0 && quality <= 1 ? quality : 0,
        index,
      };
    })
    .filter((entry) => entry.languageTag && entry.quality > 0)
    .sort((left, right) => right.quality - left.quality || left.index - right.index)
    .map((entry) => entry.languageTag);
}
