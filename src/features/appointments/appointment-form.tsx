"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type Option = { id: string; name: string };
type ProfessionalOption = Option & { serviceIds: string[] };

export function AppointmentForm({
  tenantId,
  customers,
  services,
  professionals,
  defaultLocalStart,
  defaultOpen,
}: {
  tenantId: string;
  customers: Option[];
  services: Option[];
  professionals: ProfessionalOption[];
  defaultLocalStart: string;
  defaultOpen: boolean;
}) {
  const router = useRouter();
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const eligibleProfessionals = professionals.filter((professional) =>
    professional.serviceIds.includes(serviceId),
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const fields = new FormData(event.currentTarget);
    try {
      const response = await fetch(`/api/workspaces/${tenantId}/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: fields.get("customerId"),
          serviceId: fields.get("serviceId"),
          professionalId: fields.get("professionalId"),
          localStart: fields.get("localStart"),
        }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Appointment could not be booked.");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Appointment could not be booked.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <details className="group border-b border-line py-5" open={defaultOpen}>
      <summary className="cursor-pointer list-none text-sm font-medium text-ink marker:hidden">
        <span className="inline-flex min-h-9 items-center gap-2 rounded-full bg-forest px-4 text-xs font-medium text-white">
          New appointment <span aria-hidden="true">+</span>
        </span>
      </summary>
      <form className="mt-5 grid gap-4 rounded-2xl bg-[#f0eee7] p-4 sm:grid-cols-2 lg:grid-cols-4" onSubmit={submit}>
        <label className="grid gap-1.5 text-[11px] font-medium text-muted">
          Customer
          <select className="min-h-10 rounded-lg border border-line bg-white px-3 text-sm text-ink" name="customerId" required>
            <option value="">Choose a customer</option>
            {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
          </select>
        </label>
        <label className="grid gap-1.5 text-[11px] font-medium text-muted">
          Service
          <select
            className="min-h-10 rounded-lg border border-line bg-white px-3 text-sm text-ink"
            name="serviceId"
            onChange={(event) => setServiceId(event.target.value)}
            required
            value={serviceId}
          >
            <option value="">Choose a service</option>
            {services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}
          </select>
        </label>
        <label className="grid gap-1.5 text-[11px] font-medium text-muted">
          Professional
          <select className="min-h-10 rounded-lg border border-line bg-white px-3 text-sm text-ink" name="professionalId" required>
            <option value="">Choose a professional</option>
            {eligibleProfessionals.map((professional) => <option key={professional.id} value={professional.id}>{professional.name}</option>)}
          </select>
        </label>
        <label className="grid gap-1.5 text-[11px] font-medium text-muted">
          Date and time
          <input className="min-h-10 rounded-lg border border-line bg-white px-3 text-sm text-ink" defaultValue={defaultLocalStart} name="localStart" required type="datetime-local" />
        </label>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2 lg:col-span-4">
          <button
            className="min-h-10 rounded-full bg-forest px-4 text-xs font-medium text-white disabled:opacity-60"
            disabled={busy || customers.length === 0 || services.length === 0 || eligibleProfessionals.length === 0}
            type="submit"
          >
            {busy ? "Booking…" : "Book appointment"}
          </button>
          {(!customers.length || !services.length || !eligibleProfessionals.length) && (
            <p className="text-xs text-muted">
              Add an active customer, service, and eligible professional before booking.
            </p>
          )}
          {error && <p aria-live="assertive" className="text-xs text-red-700">{error}</p>}
        </div>
      </form>
    </details>
  );
}
