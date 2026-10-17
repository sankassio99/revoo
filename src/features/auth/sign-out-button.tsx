"use client";

import { useState } from "react";
import { SignOut } from "@phosphor-icons/react";
import { useLanguage } from "@/features/i18n/language-provider";
import { translate } from "@/lib/i18n/messages";
import { useRouter } from "next/navigation";

export function SignOutButton() {
  const { locale } = useLanguage();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    try {
      const response = await fetch("/api/session", { method: "DELETE" });
      if (!response.ok) throw new Error(translate(locale, "The session could not be closed."));
      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error("Sign-out failed.", error);
      setBusy(false);
    }
  }

  return (
    <button
      className="flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-xs text-white/55 transition-colors hover:bg-white/6 hover:text-white disabled:opacity-50"
      disabled={busy}
      onClick={() => void signOut()}
      type="button"
    >
      <SignOut size={16} /> {translate(locale, busy ? "Signing out…" : "Sign out")}
    </button>
  );
}
