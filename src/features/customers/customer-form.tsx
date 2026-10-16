"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { CustomerRecord } from "@/features/customers/customer.service";

export function CustomerForm({
  tenantId,
  initial,
}: {
  tenantId: string;
  initial?: CustomerRecord;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);

    const form = event.currentTarget;
    const fields = new FormData(form);
    const fieldText = (name: string) => {
      const value = fields.get(name);
      return typeof value === "string" ? value : "";
    };
    try {
      const response = await fetch(
        initial
          ? `/api/workspaces/${tenantId}/customers/${initial.id}`
          : `/api/workspaces/${tenantId}/customers`,
        {
        method: initial ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fieldText("name"),
          phone: fieldText("phone"),
          email: fieldText("email"),
          notes: fieldText("notes"),
          communicationPreferences: {
            whatsappService: fieldText("whatsappService"),
            whatsappMarketing: fieldText("whatsappMarketing"),
            emailMarketing: fieldText("emailMarketing"),
          },
          consentMethod: fieldText("consentMethod"),
        }),
      });
      const result = (await response.json()) as {
        id?: string;
        possibleDuplicate?: boolean;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(result.error ?? "Customer could not be saved.");
      }

      if (!initial) form.reset();
      setMessage(result.possibleDuplicate
        ? "Customer saved. A similar name or phone number already exists; check before adding another record."
        : "Customer saved.");
      router.refresh();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Customer could not be saved.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="grid gap-4 sm:grid-cols-2" onSubmit={submit}>
      <label className="grid gap-2 text-xs font-medium text-ink">
        Customer name
        <input
          autoComplete="name"
          className="min-h-11 rounded-xl border border-line bg-white px-3.5 text-sm outline-none transition focus:border-forest focus:ring-2 focus:ring-forest/10"
          maxLength={120}
          name="name"
          required
          defaultValue={initial?.name}
        />
      </label>
      <label className="grid gap-2 text-xs font-medium text-ink">
        Phone
        <input
          autoComplete="tel"
          className="min-h-11 rounded-xl border border-line bg-white px-3.5 text-sm outline-none transition focus:border-forest focus:ring-2 focus:ring-forest/10"
          maxLength={24}
          name="phone"
          required
          type="tel"
          defaultValue={initial?.phone}
        />
      </label>
      <label className="grid gap-2 text-xs font-medium text-ink">
        Email <span className="font-normal text-muted">Optional</span>
        <input
          autoComplete="email"
          className="min-h-11 rounded-xl border border-line bg-white px-3.5 text-sm outline-none transition focus:border-forest focus:ring-2 focus:ring-forest/10"
          name="email"
          type="email"
          defaultValue={initial?.email ?? ""}
        />
      </label>
      <label className="grid gap-2 text-xs font-medium text-ink sm:col-span-2">
        Notes <span className="font-normal text-muted">Optional</span>
        <textarea
          className="min-h-20 resize-y rounded-xl border border-line bg-white px-3.5 py-3 text-sm outline-none transition focus:border-forest focus:ring-2 focus:ring-forest/10"
          maxLength={2000}
          name="notes"
          defaultValue={initial?.notes}
        />
      </label>
      <fieldset className="grid gap-3 rounded-xl bg-[#f0eee7] p-4 sm:col-span-2">
        <legend className="text-xs font-medium text-ink">Communication preferences</legend>
        {[
          { key: "whatsappService", label: "WhatsApp for appointment/service messages" },
          { key: "whatsappMarketing", label: "WhatsApp for marketing and reactivation" },
          { key: "emailMarketing", label: "Email for marketing and reactivation" },
        ].map((preference) => (
          <label className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted" key={preference.key}>
            {preference.label}
            <select
              className="min-h-9 rounded-lg border border-line bg-white px-2 text-xs text-ink"
              defaultValue={initial?.communicationPreferences[preference.key as keyof CustomerRecord["communicationPreferences"]] ?? "unknown"}
              name={preference.key}
            >
              <option value="unknown">Not recorded</option>
              <option value="granted">Permission given</option>
              <option value="denied">Opted out / denied</option>
            </select>
          </label>
        ))}
        <label className="grid gap-2 text-[11px] text-muted">
          How was the preference captured?
          <select className="min-h-9 rounded-lg border border-line bg-white px-2 text-xs text-ink" defaultValue="in_person" name="consentMethod">
            <option value="in_person">In person</option>
            <option value="phone">Phone</option>
            <option value="website">Website</option>
            <option value="other">Other</option>
          </select>
        </label>
      </fieldset>
      <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-forest px-5 text-xs font-medium text-white transition hover:bg-[#20483b] disabled:opacity-60"
          disabled={busy}
          type="submit"
        >
          {busy ? "Saving…" : initial ? "Save changes" : "Save customer"}
        </button>
        {message && <p aria-live="polite" className="text-xs text-forest">{message}</p>}
        {error && <p aria-live="assertive" className="text-xs text-red-700">{error}</p>}
      </div>
    </form>
  );
}
