import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Sparkle } from "@phosphor-icons/react/dist/ssr";
import { AuthForm } from "@/features/auth/auth-form";
import { getRequestLocale } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/messages";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return { title: translate(locale, "Sign in") };
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { returnTo } = await searchParams;
  const locale = await getRequestLocale();
  const redirectTo =
    returnTo?.startsWith("/") &&
    !returnTo.startsWith("//") &&
    !returnTo.includes("\\")
      ? returnTo
      : "/workspace";

  return (
    <main className="grid min-h-[100dvh] grid-cols-1 bg-paper lg:grid-cols-[1fr_0.9fr]">
      <section className="relative flex min-h-[38dvh] flex-col justify-between overflow-hidden bg-forest px-6 py-6 text-white sm:px-10 lg:min-h-[100dvh] lg:px-14 lg:py-10">
        <Link className="inline-flex w-fit items-center gap-3" href="/">
          <span className="grid size-9 place-items-center rounded-full border border-white/20 bg-white/10">
            <Sparkle size={17} weight="fill" />
          </span>
          <span className="text-lg font-semibold tracking-[-0.06em]">revoo</span>
        </Link>
        <div className="relative z-[1] max-w-[520px] py-12 lg:py-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c6d7cb]">
            {translate(locale, "Your work, held with care")}
          </p>
          <h1 className="mt-6 text-[clamp(2.7rem,5.6vw,5.6rem)] font-medium leading-[0.98] tracking-[-0.075em]">
            {translate(locale, "Come back to")}
            <br />
            <span className="font-normal text-[#d0a186]">{translate(locale, "your people.")}</span>
          </h1>
          <p className="mt-6 max-w-[390px] text-sm leading-7 text-white/70 sm:text-base">
            {translate(locale, "A calmer place for the familiar faces, well-kept details, and appointments that make your business yours.")}
          </p>
        </div>
        <div className="hidden items-center justify-between border-t border-white/15 pt-5 text-xs text-white/55 lg:flex">
          <span>{translate(locale, "Independent business, thoughtfully supported.")}</span>
          <span>01 — 04</span>
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-36 -right-32 size-[420px] rounded-full border border-white/10 sm:size-[560px]">
          <div className="absolute inset-10 rounded-full border border-white/10" />
          <div className="absolute inset-24 rounded-full border border-white/10" />
        </div>
      </section>

      <section className="flex min-h-[62dvh] flex-col px-5 py-6 sm:px-10 lg:min-h-[100dvh] lg:px-16 lg:py-10">
        <Link
          className="inline-flex w-fit items-center gap-2 text-xs text-muted transition-colors hover:text-forest"
          href="/"
        >
          <ArrowLeft size={14} /> {translate(locale, "Back to home")}
        </Link>
        <div className="mx-auto flex w-full max-w-[430px] flex-1 flex-col justify-center py-12">
          <AuthForm redirectTo={redirectTo} />
        </div>
        <p className="text-center text-[11px] leading-5 text-muted">
          {translate(locale, "By continuing, you agree to use Revoo in accordance with your business's privacy responsibilities.")}
        </p>
      </section>
    </main>
  );
}
