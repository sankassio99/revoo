"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Eye, EyeSlash, LockKey, WarningCircle } from "@phosphor-icons/react";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { getClientFirebase } from "@/lib/firebase/client";
import { useLanguage } from "@/features/i18n/language-provider";
import { translate } from "@/lib/i18n/messages";

function readableAuthError(error: unknown, locale: "en" | "pt") {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = error.code;
    if (code === "auth/invalid-credential" || code === "auth/user-not-found") {
      return translate(locale, "That email and password combination was not recognized.");
    }
    if (code === "auth/email-already-in-use") {
      return translate(locale, "An account already exists for that email. Sign in instead.");
    }
    if (code === "auth/weak-password") {
      return translate(locale, "Choose a password with at least 8 characters.");
    }
    if (code === "auth/invalid-email") {
      return translate(locale, "Enter a valid email address.");
    }
    if (code === "auth/network-request-failed") {
      return translate(locale, "We could not reach the sign-in service. Check that the local emulators are running.");
    }
  }
  return error instanceof Error
    ? translate(locale, error.message)
    : translate(locale, "We could not complete sign-in. Please try again.");
}

export function AuthForm({ redirectTo = "/workspace" }: { redirectTo?: string }) {
  const router = useRouter();
  const { locale } = useLanguage();
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      const { auth } = getClientFirebase();
      if (isRegistering) {
        const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await sendEmailVerification(credential.user);
        await signOut(auth);
        setIsRegistering(false);
        setMessage(translate(locale, "Account created. Verify your email using the link we sent, then sign in."));
        return;
      }

      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      if (!credential.user.emailVerified) {
        await sendEmailVerification(credential.user);
        await signOut(auth);
        setMessage(translate(locale, "Verify your email using the link we sent before signing in."));
        return;
      }
      const idToken = await credential.user.getIdToken(true);
      const response = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      const result: unknown = await response.json();

      if (!response.ok) {
        const detail =
          typeof result === "object" &&
          result !== null &&
          "error" in result &&
          typeof result.error === "string"
            ? result.error
            : translate(locale, "Your session could not be established.");
        throw new Error(translate(locale, detail));
      }

      router.replace(redirectTo);
      router.refresh();
    } catch (submitError) {
      setError(readableAuthError(submitError, locale));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="page-reveal">
      <div className="mb-8 inline-flex size-11 items-center justify-center rounded-full bg-forest-soft text-forest">
        <LockKey size={19} weight="regular" />
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
        {translate(locale, "Your workspace awaits")}
      </p>
      <h2 className="mt-3 text-3xl font-medium tracking-[-0.065em] text-ink sm:text-[2.6rem]">
        {translate(locale, isRegistering ? "Begin with Revoo." : "Good to see you.")}
      </h2>
      <p className="mt-3 text-sm leading-6 text-muted">
        {isRegistering
          ? translate(locale, "Create an owner account to set up your first business workspace.")
          : translate(locale, "Sign in to get back to the people and plans in your day.")}
      </p>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-2 text-xs font-medium text-ink" htmlFor="email">
          {translate(locale, "Email address")}
          <input
            autoComplete="email"
            className="min-h-12 rounded-xl border border-line bg-white px-4 text-sm outline-none transition focus:border-forest/50 focus:ring-4 focus:ring-forest/5"
            id="email"
            name="email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder={translate(locale, "you@yourstudio.com")}
            required
            type="email"
            value={email}
          />
        </label>
        <label className="flex flex-col gap-2 text-xs font-medium text-ink" htmlFor="password">
          {translate(locale, "Password")}
          <span className="relative block">
            <input
              autoComplete={isRegistering ? "new-password" : "current-password"}
              className="min-h-12 w-full rounded-xl border border-line bg-white px-4 pr-12 text-sm outline-none transition focus:border-forest/50 focus:ring-4 focus:ring-forest/5"
              id="password"
              minLength={8}
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder={translate(locale, "At least 8 characters")}
              required
              type={showPassword ? "text" : "password"}
              value={password}
            />
            <button
              aria-label={translate(locale, showPassword ? "Hide password" : "Show password")}
              className="absolute inset-y-0 right-0 grid w-12 place-items-center text-muted transition-colors hover:text-forest"
              onClick={() => setShowPassword((visible) => !visible)}
              type="button"
            >
              {showPassword ? <EyeSlash size={17} /> : <Eye size={17} />}
            </button>
          </span>
        </label>

        {error && (
          <p
            aria-live="polite"
            className="flex items-start gap-2 rounded-xl border border-[#eac8b8] bg-accent-soft px-3.5 py-3 text-xs leading-5 text-[#7f4934]"
            role="alert"
          >
            <WarningCircle className="mt-0.5 shrink-0" size={15} />
            {error}
          </p>
        )}
        {message && (
          <p aria-live="polite" className="rounded-xl border border-forest/15 bg-forest-soft px-3.5 py-3 text-xs leading-5 text-forest">
            {message}
          </p>
        )}

        <button
          className="group inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-forest px-5 text-sm font-medium text-white transition-all duration-300 hover:-translate-y-px hover:bg-[#20483b] active:scale-[0.98] disabled:cursor-wait disabled:opacity-65"
          disabled={isSubmitting}
          type="submit"
        >
          {translate(locale, isSubmitting ? "One moment…" : isRegistering ? "Create owner account" : "Sign in")}
          {!isSubmitting && (
            <ArrowRight className="transition-transform duration-300 group-hover:translate-x-0.5" size={16} />
          )}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-line" />
        <span className="text-[10px] uppercase tracking-[0.15em] text-muted">{translate(locale, "or")}</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <button
        className="min-h-11 w-full rounded-full border border-line bg-white/50 px-4 text-sm text-forest transition-colors hover:bg-white active:scale-[0.98]"
        onClick={() => {
          setError("");
          setIsRegistering((registering) => !registering);
        }}
        type="button"
      >
        {translate(locale, isRegistering ? "I already have an account" : "Create a new workspace")}
      </button>

      {!isRegistering && (
        <div className="mt-5 text-center">
          <Link className="text-xs text-muted underline decoration-line underline-offset-4 transition-colors hover:text-forest" href="/recover">
            {translate(locale, "Forgot password?")}
          </Link>
        </div>
      )}
    </div>
  );
}
