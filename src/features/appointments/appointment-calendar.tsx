"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type CalendarAppointment = {
  id: string;
  customerId: string;
  customerName: string;
  serviceName: string;
  professionalName: string;
  startAt: string;
  endAt: string;
  localStart: string;
  localTime: string;
  localDate: string;
  status: "Scheduled" | "Confirmed" | "Completed" | "Cancelled" | "NoShow";
  amountChargedMinorUnits: number | null;
  priceMinorUnits: number;
};

const transitions: Record<CalendarAppointment["status"], CalendarAppointment["status"][]> = {
  Scheduled: ["Confirmed", "Cancelled", "NoShow"],
  Confirmed: ["Completed", "Cancelled", "NoShow"],
  Completed: [],
  Cancelled: [],
  NoShow: [],
};

export function AppointmentCalendar({
  tenantId,
  appointments,
  view,
  currency,
}: {
  tenantId: string;
  appointments: CalendarAppointment[];
  view: "day" | "week";
  currency: string;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function update(payload: Record<string, unknown>, appointmentId: string) {
    setBusyId(appointmentId);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/workspaces/${tenantId}/appointments`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId, ...payload }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Appointment could not be updated.");
      setMessage("Appointment updated.");
      router.refresh();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Appointment could not be updated.");
    } finally {
      setBusyId("");
    }
  }

  if (!appointments.length) {
    return (
      <div className="border-y border-line py-10">
        <p className="text-sm font-medium text-ink">A little breathing room.</p>
        <p className="mt-1 text-xs leading-5 text-muted">There are no appointments in this view yet.</p>
      </div>
    );
  }

  const groups = view === "week"
    ? Map.groupBy(appointments, (appointment) => appointment.localDate)
    : new Map([["", appointments]]);

  return (
    <div>
      {[...groups.entries()].map(([date, items]) => (
        <section aria-label={date || "Daily appointments"} className="mb-8 last:mb-0" key={date || "day"}>
          {date && (
            <h3 className="border-y border-line py-3 text-xs font-semibold text-ink">
              {items[0]?.localDate}
            </h3>
          )}
          <div className="divide-y divide-line border-b border-line">
            {items.map((appointment) => (
              <article className="grid gap-3 py-4 sm:grid-cols-[78px_1fr_auto] sm:items-center sm:gap-5" key={appointment.id}>
                <time className="font-mono text-xs text-muted" dateTime={appointment.startAt}>
                  {appointment.localTime}
                </time>
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-medium text-ink">{appointment.customerName}</h3>
                  <p className="mt-1 truncate text-xs text-muted">
                    {appointment.serviceName} <span className="px-1 text-line">·</span> {appointment.professionalName}
                  </p>
                  <span className="mt-2 inline-flex rounded-full bg-forest-soft px-2.5 py-1 text-[10px] font-medium text-forest">
                    {appointment.status}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 sm:justify-end">
                  {transitions[appointment.status].map((status) => status === "Completed" ? (
                    <details className="relative" key={status}>
                      <summary className="cursor-pointer text-[11px] font-medium text-forest hover:underline">Complete</summary>
                      <form
                        className="absolute right-0 top-7 z-[1] grid w-56 gap-3 rounded-xl border border-line bg-white p-3 shadow-lg"
                        onSubmit={(event) => {
                          event.preventDefault();
                          const fields = new FormData(event.currentTarget);
                          const amount = fields.get("amountCharged");
                          const amountChargedMinorUnits = typeof amount === "string" && amount.trim()
                            ? Math.round(Number(amount) * 100)
                            : undefined;
                          void update(
                            { action: "status", status, ...(amountChargedMinorUnits !== undefined ? { amountChargedMinorUnits } : {}) },
                            appointment.id,
                          );
                        }}
                      >
                        <label className="grid gap-1 text-[10px] font-medium text-muted">
                          Amount charged ({currency})
                          <input className="min-h-9 rounded-lg border border-line px-2 text-xs text-ink" defaultValue={(appointment.amountChargedMinorUnits ?? appointment.priceMinorUnits) / 100} min={0} name="amountCharged" step="0.01" type="number" />
                        </label>
                        <button className="min-h-9 rounded-full bg-forest text-xs font-medium text-white disabled:opacity-60" disabled={busyId === appointment.id} type="submit">Save completion</button>
                      </form>
                    </details>
                  ) : (
                    <button
                      className={`text-[11px] font-medium transition hover:underline disabled:opacity-50 ${status === "Cancelled" ? "text-muted" : "text-forest"}`}
                      disabled={Boolean(busyId)}
                      key={status}
                      onClick={() => void update({ action: "status", status }, appointment.id)}
                      type="button"
                    >
                      {status === "NoShow" ? "Mark no-show" : status === "Cancelled" ? "Cancel" : status}
                    </button>
                  ))}
                  {(appointment.status === "Scheduled" || appointment.status === "Confirmed") && (
                    <details className="relative">
                      <summary className="cursor-pointer text-[11px] font-medium text-forest hover:underline">Reschedule</summary>
                      <form
                        className="absolute right-0 top-7 z-[1] grid w-60 gap-3 rounded-xl border border-line bg-white p-3 shadow-lg"
                        onSubmit={(event) => {
                          event.preventDefault();
                          const form = new FormData(event.currentTarget);
                          void update(
                            { action: "reschedule", localStart: form.get("localStart") },
                            appointment.id,
                          );
                        }}
                      >
                        <label className="grid gap-1 text-[10px] font-medium text-muted">
                          New date and time
                          <input className="min-h-9 rounded-lg border border-line px-2 text-xs text-ink" defaultValue={appointment.localStart} name="localStart" required type="datetime-local" />
                        </label>
                        <button className="min-h-9 rounded-full bg-forest text-xs font-medium text-white disabled:opacity-60" disabled={busyId === appointment.id} type="submit">Save new time</button>
                      </form>
                    </details>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
      {(error || message) && (
        <p aria-live={error ? "assertive" : "polite"} className={`py-3 text-xs ${error ? "text-red-700" : "text-forest"}`}>
          {error || message}
        </p>
      )}
    </div>
  );
}
