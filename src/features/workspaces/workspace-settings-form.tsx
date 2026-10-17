"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { WorkspaceSettingsInput } from "@/features/workspaces/workspace-settings.schema";
import { useLanguage } from "@/features/i18n/language-provider";
import { translate } from "@/lib/i18n/messages";

const weekdayLabels: Record<keyof WorkspaceSettingsInput["operatingHours"], string> = {
  sunday: "Sunday",
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
};

export function WorkspaceSettingsForm({
  tenantId,
  initial,
  owner,
}: {
  tenantId: string;
  initial: WorkspaceSettingsInput;
  owner: boolean;
}) {
  const router = useRouter();
  const { locale } = useLanguage();
  const [values, setValues] = useState(initial);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  function update<K extends keyof WorkspaceSettingsInput>(
    key: K,
    value: WorkspaceSettingsInput[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const response = await fetch(`/api/workspaces/${tenantId}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(translate(locale, result.error ?? "Workspace settings could not be saved."));
      setMessage(translate(locale, "Your workspace settings are up to date."));
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? translate(locale, saveError.message) : translate(locale, "Workspace settings could not be saved."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="space-y-10" onSubmit={save}>
      <section aria-labelledby="business-details-heading">
        <div className="border-b border-line pb-3">
          <h2 className="text-sm font-medium text-ink" id="business-details-heading">{translate(locale, "Business details")}</h2>
          <p className="mt-1 text-xs text-muted">{translate(locale, "These details belong to this workspace only.")}</p>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-xs font-medium text-ink">
            {translate(locale, "Business name")}
            <input className="min-h-11 rounded-xl border border-line bg-white px-3.5 text-sm outline-none focus:border-forest" disabled={!owner} maxLength={80} minLength={2} onChange={(event) => update("name", event.target.value)} value={values.name} />
          </label>
          <label className="grid gap-2 text-xs font-medium text-ink">
            {translate(locale, "Business email")}
            <input className="min-h-11 rounded-xl border border-line bg-white px-3.5 text-sm outline-none focus:border-forest" disabled={!owner} onChange={(event) => update("contact", { ...values.contact, email: event.target.value })} type="email" value={values.contact.email} />
          </label>
          <label className="grid gap-2 text-xs font-medium text-ink">
            {translate(locale, "Business phone")}
            <input className="min-h-11 rounded-xl border border-line bg-white px-3.5 text-sm outline-none focus:border-forest" disabled={!owner} onChange={(event) => update("contact", { ...values.contact, phone: event.target.value })} type="tel" value={values.contact.phone} />
          </label>
          <label className="grid gap-2 text-xs font-medium text-ink">
            {translate(locale, "Address")}
            <input className="min-h-11 rounded-xl border border-line bg-white px-3.5 text-sm outline-none focus:border-forest" disabled={!owner} onChange={(event) => update("contact", { ...values.contact, address: event.target.value })} value={values.contact.address} />
          </label>
          <label className="grid gap-2 text-xs font-medium text-ink">
            {translate(locale, "Currency")}
            <select className="min-h-11 rounded-xl border border-line bg-white px-3.5 text-sm outline-none focus:border-forest" disabled={!owner} onChange={(event) => {
              const currency = event.target.value;
              if (currency === "EUR" || currency === "GBP" || currency === "USD") {
                update("currency", currency);
              }
            }} value={values.currency}>
              <option value="EUR">EUR · {translate(locale, "Euro")}</option>
              <option value="GBP">GBP · {translate(locale, "Pound sterling")}</option>
              <option value="USD">USD · {translate(locale, "US dollar")}</option>
            </select>
          </label>
          <label className="grid gap-2 text-xs font-medium text-ink">
            {translate(locale, "IANA time zone")}
            <input className="min-h-11 rounded-xl border border-line bg-white px-3.5 text-sm outline-none focus:border-forest" disabled={!owner} onChange={(event) => update("timeZone", event.target.value)} placeholder="Europe/Lisbon" value={values.timeZone} />
          </label>
        </div>
      </section>

      <section aria-labelledby="hours-heading">
        <div className="border-b border-line pb-3">
          <h2 className="text-sm font-medium text-ink" id="hours-heading">{translate(locale, "Operating hours")}</h2>
          <p className="mt-1 text-xs text-muted">{translate(locale, "New bookings must fit fully inside the selected day's open hours.")}</p>
        </div>
        <div className="mt-4 divide-y divide-line">
          {(Object.keys(weekdayLabels) as Array<keyof typeof weekdayLabels>).map((day) => {
            const hours = values.operatingHours[day];
            return (
              <div className="grid gap-3 py-3 sm:grid-cols-[120px_100px_1fr_1fr] sm:items-center" key={day}>
                <span className="text-xs font-medium text-ink">{translate(locale, weekdayLabels[day])}</span>
                <label className="flex items-center gap-2 text-xs text-muted">
                  <input
                    checked={hours.closed}
                    className="accent-[#214b3d]"
                    disabled={!owner}
                    onChange={(event) => update("operatingHours", {
                      ...values.operatingHours,
                      [day]: { ...hours, closed: event.target.checked },
                    })}
                    type="checkbox"
                  />
                  {translate(locale, "Closed")}
                </label>
                <label className="grid grid-cols-[auto_1fr] items-center gap-2 text-[10px] text-muted">
                  {translate(locale, "Opens")}
                  <input className="min-h-9 rounded-lg border border-line bg-white px-2 text-xs text-ink" disabled={!owner || hours.closed} onChange={(event) => update("operatingHours", { ...values.operatingHours, [day]: { ...hours, open: event.target.value } })} type="time" value={hours.open} />
                </label>
                <label className="grid grid-cols-[auto_1fr] items-center gap-2 text-[10px] text-muted">
                  {translate(locale, "Closes")}
                  <input className="min-h-9 rounded-lg border border-line bg-white px-2 text-xs text-ink" disabled={!owner || hours.closed} onChange={(event) => update("operatingHours", { ...values.operatingHours, [day]: { ...hours, close: event.target.value } })} type="time" value={hours.close} />
                </label>
              </div>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="communications-heading">
        <div className="border-b border-line pb-3">
          <h2 className="text-sm font-medium text-ink" id="communications-heading">{translate(locale, "Communication intervals")}</h2>
          <p className="mt-1 text-xs text-muted">{translate(locale, "Automatic sending stays disabled until an approved provider is configured.")}</p>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-xs font-medium text-ink sm:col-span-2">
            {translate(locale, "Reminder intervals in minutes")}
            <input
              className="min-h-11 rounded-xl border border-line bg-white px-3.5 text-sm outline-none focus:border-forest disabled:bg-[#f0eee7]"
              disabled={!owner}
              onChange={(event) => {
                const intervalsMinutes = event.target.value.trim()
                  ? event.target.value.split(",").map((item) => Number(item.trim()))
                  : [];
                update("reminderSettings", { ...values.reminderSettings, intervalsMinutes });
              }}
              placeholder="1440, 120"
              value={values.reminderSettings.intervalsMinutes.join(", ")}
            />
          </label>
          <label className="flex items-center gap-2 text-xs text-ink sm:col-span-2">
            <input checked={values.reminderSettings.enabled} className="accent-[#214b3d]" disabled={!owner} onChange={(event) => update("reminderSettings", { ...values.reminderSettings, enabled: event.target.checked })} type="checkbox" />
            {translate(locale, "Reminders are configured for this workspace")}
          </label>
          <label className="grid gap-2 text-xs font-medium text-ink">
            {translate(locale, "Reactivation interval in days")}
            <input className="min-h-11 rounded-xl border border-line bg-white px-3.5 text-sm outline-none focus:border-forest disabled:bg-[#f0eee7]" disabled={!owner} max={3650} min={1} onChange={(event) => update("reactivationIntervalDays", Number(event.target.value))} type="number" value={values.reactivationIntervalDays} />
          </label>
        </div>
      </section>

      {owner && (
        <div className="flex flex-wrap items-center gap-4 border-t border-line pt-5">
          <button className="min-h-11 rounded-full bg-forest px-5 text-xs font-medium text-white disabled:opacity-60" disabled={busy} type="submit">
            {translate(locale, busy ? "Saving…" : "Save workspace settings")}
          </button>
          {error && <p aria-live="assertive" className="text-xs text-red-700">{error}</p>}
          {message && <p aria-live="polite" className="text-xs text-forest">{message}</p>}
        </div>
      )}
    </form>
  );
}
