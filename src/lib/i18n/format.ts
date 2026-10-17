import type { Locale } from "@/lib/i18n/locale";

export function formatNumber(
  value: number,
  locale: Locale,
  options?: Intl.NumberFormatOptions,
) {
  return new Intl.NumberFormat(locale, options).format(value);
}

export function formatDate(
  value: Date | number | string,
  locale: Locale,
  options?: Intl.DateTimeFormatOptions,
) {
  return new Intl.DateTimeFormat(locale, options).format(
    typeof value === "string" ? new Date(value) : value,
  );
}

export function formatCurrency(
  value: number,
  currency: string,
  locale: Locale,
  options?: Omit<Intl.NumberFormatOptions, "style" | "currency">,
) {
  return new Intl.NumberFormat(locale, {
    ...options,
    style: "currency",
    currency,
  }).format(value);
}
