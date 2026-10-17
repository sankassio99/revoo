"use client";

import { useLanguage } from "@/features/i18n/language-provider";
import { isLocale } from "@/lib/i18n/locale";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDownIcon } from "lucide-react";

export function LanguageSelector({
  className,
}: {
  className?: string;
}) {
  const { locale, messages, setLocale } = useLanguage();
  const currentLanguage =
    locale === "pt"
      ? { flag: "🇧🇷", label: messages.language.portuguese }
      : { flag: "🇺🇸", label: messages.language.english };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            aria-label={messages.language.label}
            className={className}
            size="default"
            variant="outline"
          />
        }
      >
        <span aria-hidden="true">{currentLanguage.flag}</span>
        {currentLanguage.label}
        <ChevronDownIcon aria-hidden="true" data-icon="inline-end" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuRadioGroup
          onValueChange={(value) => {
            if (isLocale(value)) setLocale(value);
          }}
          value={locale}
        >
          <DropdownMenuRadioItem className="min-h-10 gap-2 px-2" value="en">
            <span aria-hidden="true">🇺🇸</span>
            {messages.language.english}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem className="min-h-10 gap-2 px-2" value="pt">
            <span aria-hidden="true">🇧🇷</span>
            {messages.language.portuguese}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
