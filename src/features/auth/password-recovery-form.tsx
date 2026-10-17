"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, CheckCircle, WarningCircle } from "@phosphor-icons/react";
import { sendPasswordResetEmail } from "firebase/auth";
import { getClientFirebase } from "@/lib/firebase/client";
import { useLanguage } from "@/features/i18n/language-provider";
import { translate } from "@/lib/i18n/messages";

export function PasswordRecoveryForm() {
  const { locale } = useLanguage();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const { auth } = getClientFirebase();
      await sendPasswordResetEmail(auth, email.trim());
      setComplete(true);
    } catch (recoveryError) {
      const code =
        typeof recoveryError === "object" && recoveryError !== null && "code" in recoveryError
          ? recoveryError.code
          : undefined;
      setError(
        code === "auth/network-request-failed"
          ? translate(locale, "We could not reach the sign-in service. Check that the local emulators are running.")
          : translate(locale, "We could not start password recovery. Please try again."),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="page-reveal">
      <div className="mb-8 inline-flex size-11 items-center justify-center rounded-full bg-forest-soft text-forest">
        {complete ? <CheckCircle size={20} /> : <ArrowRight size={19} />}
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
        {translate(locale, "Password recovery")}
      </p>
      <h2 className="mt-3 text-3xl font-medium tracking-[-0.065em] text-ink sm:text-[2.6rem]">
        {translate(locale, complete ? "Check your inbox." : "Let’s get you back.")}
      </h2>
      <p className="mt-3 text-sm leading-6 text-muted">
        {complete
          ? translate(locale, "If that account exists, Firebase will deliver password recovery instructions.")
          : translate(locale, "Enter the email address connected to your Revoo account.")}
      </p>

      {!complete && (
        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-2 text-xs font-medium text-ink" htmlFor="recovery-email">
            {translate(locale, "Email address")}
            <input
              autoComplete="email"
              className="min-h-12 rounded-xl border border-line bg-white px-4 text-sm outline-none transition focus:border-forest/50 focus:ring-4 focus:ring-forest/5"
              id="recovery-email"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </label>
          {error && (
            <p aria-live="polite" className="flex gap-2 rounded-xl bg-accent-soft px-3.5 py-3 text-xs text-[#7f4934]" role="alert">
              <WarningCircle size={15} /> {error}
            </p>
          )}
          <button
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-forest px-5 text-sm font-medium text-white transition-all hover:-translate-y-px hover:bg-[#20483b] active:scale-[0.98] disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {translate(locale, isSubmitting ? "Sending…" : "Send recovery email")}
            {!isSubmitting && <ArrowRight size={16} />}
          </button>
        </form>
      )}
    </div>
  );
}
