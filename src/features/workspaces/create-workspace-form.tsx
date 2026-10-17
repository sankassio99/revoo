"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, Buildings, WarningCircle } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/features/i18n/language-provider";
import { translate } from "@/lib/i18n/messages";

export function CreateWorkspaceForm() {
  const router = useRouter();
  const { locale } = useLanguage();
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [timeZone, setTimeZone] = useState("UTC");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);

    try {
      const createResponse = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, currency, timeZone }),
      });
      const payload: unknown = await createResponse.json();
      if (
        !createResponse.ok ||
        typeof payload !== "object" ||
        payload === null ||
        !("tenantId" in payload) ||
        typeof payload.tenantId !== "string"
      ) {
        const message =
          typeof payload === "object" &&
          payload !== null &&
          "error" in payload &&
          typeof payload.error === "string"
            ? payload.error
            : "We could not create the workspace.";
        throw new Error(translate(locale, message));
      }

      const activeResponse = await fetch("/api/workspaces/active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: payload.tenantId }),
      });
      if (!activeResponse.ok) {
        throw new Error(translate(locale, "Your workspace was created, but we could not open it. Refresh and try again."));
      }

      router.replace("/workspace");
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : translate(locale, "We could not create the workspace. Please try again."),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="mt-8 space-y-5" onSubmit={submit}>
      <label className="flex flex-col gap-2 text-xs font-medium text-ink" htmlFor="business-name">
        {translate(locale, "Business name")}
        <input
          autoComplete="organization"
          className="min-h-12 rounded-xl border border-line bg-white px-4 text-sm outline-none transition focus:border-forest/50 focus:ring-4 focus:ring-forest/5"
          id="business-name"
          maxLength={80}
          minLength={2}
          onChange={(event) => setName(event.target.value)}
          placeholder={translate(locale, "The name on your door")}
          required
          value={name}
        />
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-xs font-medium text-ink" htmlFor="currency">
          {translate(locale, "Currency")}
          <select
            className="min-h-12 rounded-xl border border-line bg-white px-4 text-sm outline-none transition focus:border-forest/50 focus:ring-4 focus:ring-forest/5"
            id="currency"
            onChange={(event) => setCurrency(event.target.value)}
            value={currency}
          >
            <option value="EUR">{translate(locale, "Euro")} · EUR</option>
            <option value="GBP">{translate(locale, "Pound sterling")} · GBP</option>
            <option value="USD">{translate(locale, "US dollar")} · USD</option>
          </select>
        </label>

        <label className="flex flex-col gap-2 text-xs font-medium text-ink" htmlFor="time-zone">
          {translate(locale, "Time zone")}
          <input
            autoComplete="off"
            className="min-h-12 rounded-xl border border-line bg-white px-4 text-sm outline-none transition focus:border-forest/50 focus:ring-4 focus:ring-forest/5"
            id="time-zone"
            onChange={(event) => setTimeZone(event.target.value)}
            placeholder="Europe/Lisbon"
            required
            value={timeZone}
          />
        </label>
      </div>

      <p className="text-xs leading-5 text-muted">
        {translate(locale, "Your time zone keeps appointment times and business hours in step. You can adjust it later.")}
      </p>

      {error && (
        <p aria-live="polite" className="flex gap-2 rounded-xl border border-[#eac8b8] bg-accent-soft px-3.5 py-3 text-xs leading-5 text-[#7f4934]" role="alert">
          <WarningCircle className="mt-0.5 shrink-0" size={15} /> {error}
        </p>
      )}

      <button
        className="group inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-forest px-5 text-sm font-medium text-white transition-all duration-300 hover:-translate-y-px hover:bg-[#20483b] active:scale-[0.98] disabled:cursor-wait disabled:opacity-65"
        disabled={busy}
        type="submit"
      >
        <Buildings size={17} />
        {translate(locale, busy ? "Setting up…" : "Create workspace")}
        {!busy && <ArrowRight className="transition-transform group-hover:translate-x-0.5" size={16} />}
      </button>
    </form>
  );
}
