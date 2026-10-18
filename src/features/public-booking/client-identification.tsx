"use client";

import { FormEvent, useState } from "react";

type ClientProjection = { id: string; name: string; email: string };

export function ClientIdentification({
  tenantId,
  onReady,
}: {
  tenantId: string;
  onReady: (client: ClientProjection) => void;
}) {
  const [email, setEmail] = useState("");
  const [registrationRequired, setRegistrationRequired] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("Enter your email so we can find your client profile.");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function checkEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/public/workspaces/${encodeURIComponent(tenantId)}/client`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await response.json();
      if (response.status === 404 && result.registrationRequired === true) {
        setRegistrationRequired(true);
        setMessage("We couldn’t find a client profile for this email. Add your name and phone to continue.");
      } else if (response.ok && result.client?.id && result.client?.name) {
        setMessage(`Welcome back, ${result.client.name}.`);
        onReady({ ...result.client, email });
      } else {
        throw new Error(result.error ?? "We could not check this email.");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We could not check this email. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/public/workspaces/${encodeURIComponent(tenantId)}/client`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, phone }),
      });
      const result = await response.json();
      if (!response.ok || !result.client?.id) throw new Error(result.error ?? "We could not save your client details.");
      setMessage("Your client profile is ready.");
      onReady({ ...result.client, email });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We could not save your client details.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-3xl border border-line bg-white p-6 shadow-sm sm:p-8" aria-labelledby="client-profile-title">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Client details</p>
      <h2 id="client-profile-title" className="mt-2 text-2xl font-medium tracking-tight text-ink">Find your profile</h2>
      {message && <p aria-live="polite" className="mt-3 text-sm leading-6 text-muted">{message}</p>}
      {!registrationRequired && (
        <form className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]" onSubmit={checkEmail}>
          <label className="grid gap-1.5 text-xs font-medium text-ink" htmlFor="booking-email">Email address
            <input autoComplete="email" className="min-h-12 rounded-xl border border-line bg-[#fbfcf9] px-4 text-sm" id="booking-email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
          </label>
          <button className="mt-auto min-h-12 rounded-full bg-forest px-5 text-sm font-medium text-white disabled:opacity-60" disabled={busy} type="submit">{busy ? "Checking…" : "Continue with email"}</button>
        </form>
      )}
      {registrationRequired && (
        <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={register}>
          <p className="text-sm text-muted sm:col-span-2">Email: <span className="font-medium text-ink">{email}</span></p>
          <label className="grid gap-1.5 text-xs font-medium text-ink" htmlFor="client-name">Name
            <input autoComplete="name" className="min-h-12 rounded-xl border border-line bg-[#fbfcf9] px-4 text-sm" id="client-name" maxLength={120} minLength={2} onChange={(event) => setName(event.target.value)} required value={name} />
          </label>
          <label className="grid gap-1.5 text-xs font-medium text-ink" htmlFor="client-phone">Phone
            <input autoComplete="tel" className="min-h-12 rounded-xl border border-line bg-[#fbfcf9] px-4 text-sm" id="client-phone" maxLength={24} minLength={7} onChange={(event) => setPhone(event.target.value)} required type="tel" value={phone} />
          </label>
          <button className="min-h-12 rounded-full bg-forest px-5 text-sm font-medium text-white disabled:opacity-60 sm:col-span-2" disabled={busy} type="submit">{busy ? "Saving…" : "Save and continue"}</button>
        </form>
      )}
      {error && <p aria-live="polite" className="mt-4 rounded-xl bg-accent-soft px-4 py-3 text-sm text-[#7f4934]" role="alert">{error}</p>}
    </section>
  );
}
