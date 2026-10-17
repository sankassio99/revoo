"use client";

import Link from "next/link";
import { Plus } from "@phosphor-icons/react/dist/ssr";
import { useLanguage } from "@/features/i18n/language-provider";
import { translate } from "@/lib/i18n/messages";

export function CreateWorkspaceButton() {
  const { locale } = useLanguage();

  return (
    <Link
      className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/15 px-3.5 text-xs font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
      href="/workspace/new"
    >
      <Plus size={15} /> {translate(locale, "New workspace")}
    </Link>
  );
}
