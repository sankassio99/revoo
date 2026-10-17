"use client";

import { useLanguage } from "@/features/i18n/language-provider";
import { isLocale } from "@/lib/i18n/locale";

export function LanguageSelector({
  className,
}: {
  className?: string;
}) {
  const { locale, messages, setLocale } = useLanguage();

  return (
    <label className={className}>
      <span className="sr-only">{messages.language.label}</span>
      <select
        aria-label={messages.language.label}
        className="min-h-10 rounded-full border border-line bg-white/70 px-3 text-sm font-medium text-ink outline-none transition-colors hover:border-forest/30 focus-visible:ring-2 focus-visible:ring-forest"
        onChange={(event) => {
          const selectedLocale = event.target.value;
          if (isLocale(selectedLocale)) setLocale(selectedLocale);
        }}
        value={locale}
      >
        <option value="en">{messages.language.english}</option>
        <option value="pt">{messages.language.portuguese}</option>
      </select>
    </label>
  );
}
