"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/features/i18n/language-provider";
import { translate } from "@/lib/i18n/messages";
import { formatCurrency, formatNumber } from "@/lib/i18n/format";

type ServiceItem = {
  id: string;
  name: string;
  durationMinutes: number;
  priceMinorUnits: number;
  status: "active" | "inactive";
};

type ProfessionalItem = {
  id: string;
  name: string;
  serviceIds: string[];
  status: "active" | "inactive";
};

export function CatalogManager({
  tenantId,
  currency,
  services,
  professionals,
  owner,
}: {
  tenantId: string;
  currency: string;
  services: ServiceItem[];
  professionals: ProfessionalItem[];
  owner: boolean;
}) {
  const router = useRouter();
  const { locale } = useLanguage();
  const [serviceName, setServiceName] = useState("");
  const [duration, setDuration] = useState("30");
  const [price, setPrice] = useState("");
  const [serviceEditId, setServiceEditId] = useState("");
  const [professionalName, setProfessionalName] = useState("");
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [professionalEditId, setProfessionalEditId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function save(
    method: "POST" | "PATCH",
    payload: Record<string, unknown>,
  ) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/workspaces/${tenantId}/catalog`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(translate(locale, result.error ?? "Catalog change could not be saved."));
      setMessage(translate(locale, "Changes saved."));
      router.refresh();
      return true;
    } catch (saveError) {
      setError(saveError instanceof Error ? translate(locale, saveError.message) : translate(locale, "Catalog change could not be saved."));
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function submitService(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = Number(price);
    if (!Number.isFinite(amount) || amount < 0) {
      setError(translate(locale, "Enter a non-negative service price."));
      return;
    }
    const value = {
      name: serviceName,
      durationMinutes: Number(duration),
      priceMinorUnits: Math.round(amount * 100),
    };
    const saved = await save(
      serviceEditId ? "PATCH" : "POST",
      serviceEditId
        ? { kind: "service", id: serviceEditId, value }
        : { kind: "service", value },
    );
    if (saved) {
      setServiceName("");
      setDuration("30");
      setPrice("");
      setServiceEditId("");
    }
  }

  async function submitProfessional(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = { name: professionalName, serviceIds };
    const saved = await save(
      professionalEditId ? "PATCH" : "POST",
      professionalEditId
        ? { kind: "professional", id: professionalEditId, value }
        : { kind: "professional", value },
    );
    if (saved) {
      setProfessionalName("");
      setServiceIds([]);
      setProfessionalEditId("");
    }
  }

  function startServiceEdit(service: ServiceItem) {
    setServiceEditId(service.id);
    setServiceName(service.name);
    setDuration(String(service.durationMinutes));
    setPrice((service.priceMinorUnits / 100).toFixed(2));
  }

  function startProfessionalEdit(professional: ProfessionalItem) {
    setProfessionalEditId(professional.id);
    setProfessionalName(professional.name);
    setServiceIds(professional.serviceIds);
  }

  return (
    <div className="grid gap-10 xl:grid-cols-2">
      <section aria-labelledby="services-heading">
        <div className="flex items-end justify-between gap-3 border-b border-line pb-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-accent">{translate(locale, "What you offer")}</p>
            <h2 className="mt-2 text-xl font-medium tracking-[-0.05em] text-ink" id="services-heading">{translate(locale, "Services")}</h2>
          </div>
          <span className="text-xs text-muted">{formatNumber(services.length, locale)} {translate(locale, "total")}</span>
        </div>

        {services.length ? (
          <ul className="divide-y divide-line">
            {services.map((service) => (
              <li className="flex items-center gap-3 py-4" key={service.id}>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{service.name}</p>
                  <p className="mt-1 text-xs text-muted">
                    {formatNumber(service.durationMinutes, locale)} {translate(locale, "min")} <span className="px-1 text-line">·</span>
                    {formatCurrency(service.priceMinorUnits / 100, currency, locale)}
                  </p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${service.status === "active" ? "bg-forest-soft text-forest" : "bg-[#eeece6] text-muted"}`}>
                  {translate(locale, service.status)}
                </span>
                {owner && (
                  <div className="flex gap-2">
                    <button className="text-xs font-medium text-forest hover:underline" onClick={() => startServiceEdit(service)} type="button">{translate(locale, "Edit")}</button>
                    <button
                      className="text-xs font-medium text-muted hover:text-forest"
                      disabled={busy}
                      onClick={() => void save("PATCH", { kind: "service", id: service.id, value: { status: service.status === "active" ? "inactive" : "active" } })}
                      type="button"
                    >
                      {translate(locale, service.status === "active" ? "Deactivate" : "Activate")}
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="border-b border-line py-7 text-xs text-muted">{translate(locale, "Services you create will appear here.")}</p>
        )}

        {owner && (
          <form className="mt-5 grid gap-3 rounded-2xl bg-[#f0eee7] p-4 sm:grid-cols-2" onSubmit={submitService}>
            <h3 className="text-xs font-semibold text-ink sm:col-span-2">{translate(locale, serviceEditId ? "Edit service" : "Add a service")}</h3>
            <label className="grid gap-1.5 text-[11px] font-medium text-muted sm:col-span-2">
              {translate(locale, "Service name")}
              <input className="min-h-10 rounded-lg border border-line bg-white px-3 text-sm text-ink" maxLength={100} minLength={2} onChange={(event) => setServiceName(event.target.value)} required value={serviceName} />
            </label>
            <label className="grid gap-1.5 text-[11px] font-medium text-muted">
              {translate(locale, "Duration in minutes")}
              <input className="min-h-10 rounded-lg border border-line bg-white px-3 text-sm text-ink" min={1} onChange={(event) => setDuration(event.target.value)} required type="number" value={duration} />
            </label>
            <label className="grid gap-1.5 text-[11px] font-medium text-muted">
              {translate(locale, "Price")} ({currency})
              <input className="min-h-10 rounded-lg border border-line bg-white px-3 text-sm text-ink" min={0} onChange={(event) => setPrice(event.target.value)} required step="0.01" type="number" value={price} />
            </label>
            <div className="flex items-center gap-3 sm:col-span-2">
              <button className="min-h-10 rounded-full bg-forest px-4 text-xs font-medium text-white disabled:opacity-60" disabled={busy} type="submit">
                {translate(locale, busy ? "Saving…" : serviceEditId ? "Save service" : "Add service")}
              </button>
              {serviceEditId && <button className="text-xs text-muted hover:text-ink" onClick={() => { setServiceEditId(""); setServiceName(""); setPrice(""); setDuration("30"); }} type="button">{translate(locale, "Cancel")}</button>}
            </div>
          </form>
        )}
      </section>

      <section aria-labelledby="professionals-heading">
        <div className="flex items-end justify-between gap-3 border-b border-line pb-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-accent">{translate(locale, "The people who make it happen")}</p>
            <h2 className="mt-2 text-xl font-medium tracking-[-0.05em] text-ink" id="professionals-heading">{translate(locale, "Professionals")}</h2>
          </div>
          <span className="text-xs text-muted">{formatNumber(professionals.length, locale)} {translate(locale, "total")}</span>
        </div>

        {professionals.length ? (
          <ul className="divide-y divide-line">
            {professionals.map((professional) => {
              const names = professional.serviceIds
                .map((serviceId) => services.find((service) => service.id === serviceId)?.name)
                .filter((name): name is string => Boolean(name));
              return (
                <li className="flex items-center gap-3 py-4" key={professional.id}>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{professional.name}</p>
                    <p className="mt-1 truncate text-xs text-muted">{names.join(", ") || translate(locale, "No services")}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${professional.status === "active" ? "bg-forest-soft text-forest" : "bg-[#eeece6] text-muted"}`}>
                    {translate(locale, professional.status)}
                  </span>
                  {owner && (
                    <div className="flex gap-2">
                      <button className="text-xs font-medium text-forest hover:underline" onClick={() => startProfessionalEdit(professional)} type="button">{translate(locale, "Edit")}</button>
                      <button
                        className="text-xs font-medium text-muted hover:text-forest"
                        disabled={busy}
                        onClick={() => void save("PATCH", { kind: "professional", id: professional.id, value: { status: professional.status === "active" ? "inactive" : "active" } })}
                        type="button"
                      >
                        {translate(locale, professional.status === "active" ? "Deactivate" : "Activate")}
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="border-b border-line py-7 text-xs text-muted">{translate(locale, "Your team will appear here.")}</p>
        )}

        {owner && (
          <form className="mt-5 grid gap-3 rounded-2xl bg-[#f0eee7] p-4" onSubmit={submitProfessional}>
            <h3 className="text-xs font-semibold text-ink">{translate(locale, professionalEditId ? "Edit professional" : "Add a professional")}</h3>
            <label className="grid gap-1.5 text-[11px] font-medium text-muted">
              {translate(locale, "Professional name")}
              <input className="min-h-10 rounded-lg border border-line bg-white px-3 text-sm text-ink" maxLength={100} minLength={2} onChange={(event) => setProfessionalName(event.target.value)} required value={professionalName} />
            </label>
            <fieldset className="grid gap-2">
              <legend className="text-[11px] font-medium text-muted">{translate(locale, "Services they can perform")}</legend>
              {services.filter((service) => service.status === "active").length ? (
                services.filter((service) => service.status === "active").map((service) => (
                  <label className="flex items-center gap-2 text-xs text-ink" key={service.id}>
                    <input
                      checked={serviceIds.includes(service.id)}
                      className="accent-[#214b3d]"
                      onChange={(event) => setServiceIds((selected) => event.target.checked ? [...selected, service.id] : selected.filter((id) => id !== service.id))}
                      type="checkbox"
                    />
                    {service.name}
                  </label>
                ))
              ) : (
                <p className="text-xs text-muted">{translate(locale, "Create an active service first.")}</p>
              )}
            </fieldset>
            <div className="flex items-center gap-3">
              <button className="min-h-10 rounded-full bg-forest px-4 text-xs font-medium text-white disabled:opacity-60" disabled={busy || !services.some((service) => service.status === "active")} type="submit">
                {translate(locale, busy ? "Saving…" : professionalEditId ? "Save professional" : "Add professional")}
              </button>
              {professionalEditId && <button className="text-xs text-muted hover:text-ink" onClick={() => { setProfessionalEditId(""); setProfessionalName(""); setServiceIds([]); }} type="button">{translate(locale, "Cancel")}</button>}
            </div>
          </form>
        )}
      </section>

      {(error || message) && (
        <div className="xl:col-span-2">
          {error && <p aria-live="assertive" className="text-xs text-red-700">{error}</p>}
          {message && <p aria-live="polite" className="text-xs text-forest">{message}</p>}
        </div>
      )}
    </div>
  );
}
