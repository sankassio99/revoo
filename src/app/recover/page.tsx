import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { PasswordRecoveryForm } from "@/features/auth/password-recovery-form";

export const metadata: Metadata = {
  title: "Password recovery",
};

export default function RecoverPage() {
  return (
    <main className="grid min-h-[100dvh] grid-cols-1 bg-paper lg:grid-cols-[0.9fr_1.1fr]">
      <section className="flex min-h-[34dvh] flex-col justify-between bg-forest px-6 py-6 text-white sm:px-10 lg:min-h-[100dvh] lg:px-14 lg:py-10">
        <span className="text-lg font-semibold tracking-[-0.06em]">revoo</span>
        <div className="max-w-[460px] py-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c6d7cb]">
            A fresh start
          </p>
          <h1 className="mt-5 text-[clamp(2.7rem,5.6vw,5.3rem)] font-medium leading-[0.98] tracking-[-0.075em]">
            We&apos;ll help
            <br />
            <span className="font-normal text-[#d0a186]">you back in.</span>
          </h1>
        </div>
        <p className="hidden border-t border-white/15 pt-5 text-xs text-white/55 lg:block">
          Your work, held with care.
        </p>
      </section>
      <section className="flex flex-col px-5 py-6 sm:px-10 lg:px-16 lg:py-10">
        <Link
          className="inline-flex w-fit items-center gap-2 text-xs text-muted transition-colors hover:text-forest"
          href="/login"
        >
          <ArrowLeft size={14} /> Back to sign in
        </Link>
        <div className="mx-auto flex w-full max-w-[430px] flex-1 flex-col justify-center py-12">
          <PasswordRecoveryForm />
        </div>
      </section>
    </main>
  );
}
