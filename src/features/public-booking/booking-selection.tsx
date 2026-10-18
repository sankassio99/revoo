"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ClientIdentification } from "@/features/public-booking/client-identification";
import { BookingConfirmation, type PublicBookingConfirmation } from "@/features/public-booking/booking-confirmation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { translate } from "@/lib/i18n/messages";
import { useLanguage } from "../i18n/language-provider";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDownIcon } from "lucide-react";

type Service = { id: string; name: string; durationMinutes: number; priceMinorUnits: number };
type Professional = { id: string; name: string; serviceIds: string[] };
type Options = { workspace: { name: string; timeZone: string }; services: Service[]; professionals: Professional[] };
type Selection = { professionalId: string; serviceIds: string[]; date: string; time: string };
type Client = { id: string; name: string; email: string };
const selectionKey = "revoo-public-booking-selection";

function localToday(timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function BookingSelection({ tenantId, options }: { tenantId: string; options: Options }) {
  const { locale } = useLanguage();
  const today = useMemo(() => localToday(options.workspace.timeZone), [options.workspace.timeZone]);
  const [selection, setSelection] = useState<Selection>({ professionalId: "", serviceIds: [], date: today, time: "" });
  const [hydrated, setHydrated] = useState(false);
  const [stage, setStage] = useState<"selection" | "identity" | "confirm" | "complete">("selection");
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [availabilityResultKey, setAvailabilityResultKey] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(0);
  const [priceMinorUnits, setPriceMinorUnits] = useState(0);
  const [availabilityBusy, setAvailabilityBusy] = useState(false);
  const [bookingBusy, setBookingBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [client, setClient] = useState<Client | null>(null);
  const [confirmation, setConfirmation] = useState<PublicBookingConfirmation | null>(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const saved = sessionStorage.getItem(selectionKey);
        if (saved) {
          const value: unknown = JSON.parse(saved);
          if (typeof value === "object" && value !== null) {
            const candidate = value as Partial<Selection>;
            if (typeof candidate.professionalId === "string" && Array.isArray(candidate.serviceIds) && typeof candidate.date === "string") {
              setSelection({
                professionalId: candidate.professionalId,
                serviceIds: candidate.serviceIds.filter((id): id is string => typeof id === "string"),
                date: candidate.date,
                time: typeof candidate.time === "string" ? candidate.time : "",
              });
            }
          }
        }
      } catch { /* Invalid browser state is discarded. */ }
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (hydrated) sessionStorage.setItem(selectionKey, JSON.stringify(selection));
  }, [hydrated, selection]);

  useEffect(() => {
    if (!selection.professionalId || !selection.serviceIds.length || !selection.date) {
      return;
    }
    const controller = new AbortController();
    const query = new URLSearchParams({ professionalId: selection.professionalId, date: selection.date });
    selection.serviceIds.forEach((id) => query.append("serviceIds", id));
    const currentKey = `${selection.professionalId}|${selection.date}|${selection.serviceIds.join(",")}|${refresh}`;
    const timer = window.setTimeout(() => {
      if (controller.signal.aborted) return;
      setAvailabilityBusy(true);
      setError("");
      void fetch(`/api/public/workspaces/${encodeURIComponent(tenantId)}/availability?${query}`, { signal: controller.signal })
        .then(async (response) => {
          const result = await response.json();
          if (!response.ok) throw new Error(result.error ?? "Availability could not be loaded.");
          setAvailableTimes(result.availableTimes ?? []);
          setDurationMinutes(result.durationMinutes ?? 0);
          setPriceMinorUnits(result.priceMinorUnits ?? 0);
          setAvailabilityResultKey(currentKey);
        })
        .catch((cause: unknown) => {
          if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Availability could not be loaded.");
        })
        .finally(() => { if (!controller.signal.aborted) setAvailabilityBusy(false); });
    }, 0);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [tenantId, selection.professionalId, selection.serviceIds, selection.date, refresh]);

  const selectedServices = options.services.filter((service) => selection.serviceIds.includes(service.id));
  const selectedProfessional = options.professionals.find((professional) => professional.id === selection.professionalId);
  const canContinue = Boolean(selectedProfessional && selectedServices.length && selection.time);
  const currentAvailabilityKey = `${selection.professionalId}|${selection.date}|${selection.serviceIds.join(",")}|${refresh}`;
  const currentAvailableTimes = availabilityResultKey === currentAvailabilityKey ? availableTimes : [];

  function toggleService(id: string) {
    setSelection((current) => ({
      ...current,
      serviceIds: current.serviceIds.includes(id) ? current.serviceIds.filter((serviceId) => serviceId !== id) : [...current.serviceIds, id],
      time: "",
    }));
  }

  const clientReady = useCallback((value: Client) => {
    setClient(value);
  }, []);

  async function confirmBooking() {
    if (!selection.time || !client) return;
    setBookingBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/public/workspaces/${encodeURIComponent(tenantId)}/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: client.email, professionalId: selection.professionalId, serviceIds: selection.serviceIds, localStart: `${selection.date}T${selection.time}` }),
      });
      const result = await response.json();
      if (response.status === 409) {
        setSelection((current) => ({ ...current, time: "" }));
        setStage("selection");
        setMessage("That time was just taken. Choose another available time; your other choices are saved.");
        setRefresh((current) => current + 1);
        return;
      }
      if (!response.ok) throw new Error(result.error ?? "We could not confirm this appointment.");
      setConfirmation(result.appointment as PublicBookingConfirmation);
      setStage("complete");
      sessionStorage.removeItem(selectionKey);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We could not confirm this appointment.");
    } finally {
      setBookingBusy(false);
    }
  }

  if (stage === "complete" && confirmation) return <BookingConfirmation appointment={confirmation} />;
  return (
    <div className="grid gap-6 lg:grid-cols-[1.25fr_.75fr]">
      <section className="rounded-3xl border border-line bg-white p-6 shadow-sm sm:p-8" aria-labelledby="booking-selection-title">
        <div className="flex items-start justify-between gap-4">
          <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Appointment details</p><h2 id="booking-selection-title" className="mt-2 text-2xl font-medium tracking-tight text-ink">Choose a time</h2></div>
          <span className="rounded-full bg-forest-soft px-3 py-1.5 text-[11px] font-medium text-forest">{options.workspace.timeZone}</span>
        </div>
        {options.services.length === 0 || options.professionals.length === 0 ? (
          <p className="mt-6 rounded-2xl bg-[#f4f5f0] p-5 text-sm text-muted">This workspace has no bookable services or professionals at the moment. Please check again later.</p>
        ) : (
          <div className="mt-6 grid gap-5">
            <label className="grid gap-2 text-xs font-medium text-ink" htmlFor="booking-professional">
              Professional

              <Select
                items={options.professionals.map((professional) => ({ value: professional.id, label: professional.name }))}
                onValueChange={(value: string | null) => setSelection((current) => ({ ...current, professionalId: value!, time: "" }))}
              >
                <SelectTrigger className="min-h-12 w-full bg-white">
                  <SelectValue placeholder={translate(locale, "Choose a professional")} />
                </SelectTrigger>
                <SelectContent>
                  {options.professionals.map((professional) => <SelectItem key={professional.id} value={professional.id}>{professional.name}</SelectItem>)}
                </SelectContent>
              </Select>

            </label>

            <div className="grid gap-2">
              <span className="text-xs font-medium text-ink" id="booking-services-label">Services</span>
              <DropdownMenu>
                <DropdownMenuTrigger
                  aria-labelledby="booking-services-label"
                  className="flex min-h-12 w-full items-center justify-between rounded-xl border border-line bg-white px-4 text-left text-sm outline-none focus-visible:ring-2 focus-visible:ring-forest/40"
                >
                  <span className={selectedServices.length ? "text-ink" : "text-muted"}>
                    {selectedServices.length ? selectedServices.map((service) => service.name).join(", ") : translate(locale, "Choose services")}
                  </span>
                  <ChevronDownIcon className="size-4 shrink-0 text-muted" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-(--anchor-width) min-w-64">
                  {options.services.map((service) => {
                    const compatible = !selectedProfessional || selectedProfessional.serviceIds.includes(service.id);
                    return (
                      <DropdownMenuCheckboxItem
                        checked={selection.serviceIds.includes(service.id)}
                        closeOnClick={false}
                        disabled={!compatible}
                        key={service.id}
                        onCheckedChange={() => toggleService(service.id)}
                      >
                        <span className="flex-1">
                          {service.name}
                          <span className="block text-xs text-muted">{service.durationMinutes} min · {(service.priceMinorUnits / 100).toFixed(2)}</span>
                        </span>
                      </DropdownMenuCheckboxItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <label className="grid max-w-xs gap-2 text-xs font-medium text-ink" htmlFor="booking-date">Date
              <input className="min-h-12 rounded-xl border border-line bg-[#fbfcf9] px-4 text-sm" id="booking-date" min={today} onChange={(event) => setSelection((current) => ({ ...current, date: event.target.value, time: "" }))} type="date" value={selection.date} />
            </label>
            <div>
              <h3 className="text-xs font-medium text-ink">Available start times</h3>
              {!selection.professionalId || !selection.serviceIds.length ? <p className="mt-2 text-sm text-muted">Choose a professional and at least one service to see available times.</p>
                : availabilityBusy || availabilityResultKey !== currentAvailabilityKey ? <p className="mt-2 text-sm text-muted">Checking this day’s availability…</p>
                  : currentAvailableTimes.length ? <div className="mt-3 flex flex-wrap gap-2">{currentAvailableTimes.map((time) => <button aria-pressed={selection.time === time} className={`min-h-10 rounded-full border px-4 text-sm ${selection.time === time ? "border-forest bg-forest text-white" : "border-line bg-white text-ink hover:border-forest/50"}`} key={time} onClick={() => setSelection((current) => ({ ...current, time }))} type="button">{time}</button>)}</div>
                    : <p className="mt-2 rounded-xl bg-[#f4f5f0] px-4 py-3 text-sm text-muted">No times are available for these choices. Try another date or change the services or professional.</p>}
            </div>
          </div>
        )}
        {error && <p aria-live="polite" className="mt-4 rounded-xl bg-accent-soft px-4 py-3 text-sm text-[#7f4934]" role="alert">{error}</p>}
        {message && <p aria-live="polite" className="mt-4 rounded-xl bg-forest-soft px-4 py-3 text-sm text-forest">{message}</p>}
        {stage === "selection" && <button className="mt-6 min-h-12 rounded-full bg-forest px-6 text-sm font-medium text-white disabled:opacity-50" disabled={!canContinue} onClick={() => { setError(""); setStage("identity"); }} type="button">Continue</button>}
      </section>
      <aside className="h-fit rounded-3xl bg-[#f0eee7] p-6 sm:p-8" aria-label="Booking summary">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Your selection</p>
        <h2 className="mt-2 text-xl font-medium tracking-tight text-ink">{options.workspace.name}</h2>
        <dl className="mt-5 grid gap-3 text-sm">
          <div><dt className="text-xs text-muted">Professional</dt><dd className="mt-0.5 text-ink">{selectedProfessional?.name ?? "Not selected"}</dd></div>
          <div><dt className="text-xs text-muted">Services</dt><dd className="mt-0.5 text-ink">{selectedServices.length ? selectedServices.map((service) => service.name).join(", ") : "Not selected"}</dd></div>
          <div><dt className="text-xs text-muted">Date and time</dt><dd className="mt-0.5 text-ink">{selection.date}{selection.time ? ` · ${selection.time}` : " · Choose a time"}</dd></div>
          {durationMinutes > 0 && selectedServices.length > 0 && <div><dt className="text-xs text-muted">Duration and total</dt><dd className="mt-0.5 text-ink">{durationMinutes} min · {(priceMinorUnits / 100).toFixed(2)}</dd></div>}
        </dl>
        {stage !== "selection" && stage !== "complete" && <button className="mt-6 min-h-10 text-sm text-forest underline underline-offset-4" onClick={() => { setStage("selection"); setClient(null); }} type="button">Back to choices</button>}
        {stage === "identity" && <div className="mt-6"><ClientIdentification onReady={clientReady} tenantId={tenantId} />{client && <button className="mt-4 min-h-12 w-full rounded-full bg-forest px-5 text-sm font-medium text-white" onClick={() => setStage("confirm")} type="button">Continue to confirmation</button>}</div>}
        {stage === "confirm" && client && <div className="mt-6 rounded-2xl border border-line bg-white p-5"><p className="text-sm text-muted">Booking for</p><p className="mt-1 font-medium text-ink">{client.name}</p><p className="mt-3 text-sm text-muted">{selectedProfessional?.name} · {selectedServices.map((service) => service.name).join(", ")}</p><p className="mt-1 text-sm text-ink">{selection.date} at {selection.time} ({options.workspace.timeZone})</p><button className="mt-5 min-h-12 w-full rounded-full bg-forest px-5 text-sm font-medium text-white disabled:opacity-60" disabled={bookingBusy} onClick={() => void confirmBooking()} type="button">{bookingBusy ? "Confirming…" : "Confirm appointment"}</button></div>}
      </aside>
    </div>
  );
}
