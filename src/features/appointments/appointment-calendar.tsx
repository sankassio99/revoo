"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreHorizontalIcon } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { solidTone } from "@/components/ui/tones";
import { cn } from "cn";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useLanguage } from "@/features/i18n/language-provider";
import { translate } from "@/lib/i18n/messages";

export type CalendarAppointment = {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
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

type UpdatePayload = Record<string, unknown>;

const ALL_PROFESSIONALS = "__all__";
const SERVICE_TONES = ["leaf", "brand", "sun"] as const;

function toneFor(serviceName: string) {
  let hash = 0;
  for (const char of serviceName) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return SERVICE_TONES[hash % SERVICE_TONES.length]!;
}

function AppointmentActions({
  appointment,
  currency,
  dark,
  disabled,
  onUpdate,
}: {
  appointment: CalendarAppointment;
  currency: string;
  dark: boolean;
  disabled: boolean;
  onUpdate: (appointmentId: string, payload: UpdatePayload) => Promise<boolean>;
}) {
  const { locale } = useLanguage();
  const t = (text: string) => translate(locale, text);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const { status } = appointment;
  const isOpen = status === "Scheduled" || status === "Confirmed";

  if (!isOpen) return null;

  async function complete(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = String(new FormData(event.currentTarget).get("amountCharged") ?? "").trim();
    const payload: UpdatePayload = { action: "status", status: "Completed" };
    if (amount) payload.amountChargedMinorUnits = Math.round(Number(amount) * 100);
    if (await onUpdate(appointment.id, payload)) setCompleteOpen(false);
  }

  async function reschedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const localStart = new FormData(event.currentTarget).get("localStart");
    if (await onUpdate(appointment.id, { action: "reschedule", localStart })) {
      setRescheduleOpen(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {status === "Scheduled" && (
        <Button
          disabled={disabled}
          onClick={() => void onUpdate(appointment.id, { action: "status", status: "Confirmed" })}
          size="sm"
          variant={dark ? "secondary" : "default"}
        >
          {t("Confirm")}
        </Button>
      )}
      {status === "Confirmed" && (
        <Popover onOpenChange={setCompleteOpen} open={completeOpen}>
          <PopoverTrigger render={<Button disabled={disabled} size="sm" variant={dark ? "secondary" : "default"} />}>{t("Complete")}</PopoverTrigger>
          <PopoverContent align="end" className="w-60">
            <form className="grid gap-3" onSubmit={complete}>
              <div className="grid gap-1.5">
                <Label htmlFor={`amount-${appointment.id}`}>
                  {t("Amount charged")} ({currency})
                </Label>
                <Input
                  defaultValue={(appointment.amountChargedMinorUnits ?? appointment.priceMinorUnits) / 100}
                  id={`amount-${appointment.id}`}
                  min={0}
                  name="amountCharged"
                  step="0.01"
                  type="number"
                />
              </div>
              <Button disabled={disabled} type="submit">{t("Save completion")}</Button>
            </form>
          </PopoverContent>
        </Popover>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button aria-label={t("More actions")} disabled={disabled} size="icon-sm" variant="secondary" />}
        >
          <MoreHorizontalIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setRescheduleOpen(true)}>{t("Reschedule")}</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => void onUpdate(appointment.id, { action: "status", status: "NoShow" })}>
            {t("Mark no-show")}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => void onUpdate(appointment.id, { action: "status", status: "Cancelled" })}
            variant="destructive"
          >
            {t("Cancel")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Sheet onOpenChange={setRescheduleOpen} open={rescheduleOpen}>
        <SheetContent>
          <form className="flex h-full flex-col" onSubmit={reschedule}>
            <SheetHeader>
              <SheetTitle>{t("Reschedule")}</SheetTitle>
              <SheetDescription>{appointment.customerName}</SheetDescription>
            </SheetHeader>
            <div className="grid gap-1.5 px-4">
              <Label htmlFor={`start-${appointment.id}`}>{t("New date and time")}</Label>
              <Input
                defaultValue={appointment.localStart}
                id={`start-${appointment.id}`}
                name="localStart"
                required
                type="datetime-local"
              />
            </div>
            <SheetFooter>
              <Button disabled={disabled} type="submit">{t("Save new time")}</Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}

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
  const { locale } = useLanguage();
  const [busy, setBusy] = useState(false);
  const [professional, setProfessional] = useState(ALL_PROFESSIONALS);

  const professionals = useMemo(
    () => [...new Set(appointments.map((a) => a.professionalName))].sort((a, b) => a.localeCompare(b)),
    [appointments],
  );
  const visibleAppointments = useMemo(
    () => (professional === ALL_PROFESSIONALS ? appointments : appointments.filter((a) => a.professionalName === professional)),
    [appointments, professional],
  );

  async function update(appointmentId: string, payload: UpdatePayload) {
    setBusy(true);
    try {
      const response = await fetch(`/api/workspaces/${tenantId}/appointments`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId, ...payload }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Appointment could not be updated.");
      toast.success(translate(locale, "Appointment updated."));
      router.refresh();
      return true;
    } catch (updateError) {
      toast.error(translate(locale, updateError instanceof Error ? updateError.message : "Appointment could not be updated."));
      return false;
    } finally {
      setBusy(false);
    }
  }

  if (!appointments.length) {
    return (
      <div className="border-y border-line py-10">
        <p className="text-sm font-medium text-ink">{translate(locale, "A little breathing room.")}</p>
        <p className="mt-1 text-xs leading-5 text-muted">{translate(locale, "There are no appointments in this view yet.")}</p>
      </div>
    );
  }

  const groups = view === "week"
    ? Map.groupBy(visibleAppointments, (appointment) => appointment.localDate)
    : new Map([["", visibleAppointments]]);

  return (
    <div>
      {professionals.length > 1 && (
        <div className="mb-5 flex items-center justify-between gap-3">
          <Select onValueChange={(value) => setProfessional(value ?? ALL_PROFESSIONALS)} value={professional}>
            <SelectTrigger aria-label={translate(locale, "Professional")} className="h-11 w-auto min-w-52 rounded-full border-0 bg-surface px-5" id="professional-filter">
              <SelectValue>
                {professional === ALL_PROFESSIONALS ? translate(locale, "All professionals") : professional}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_PROFESSIONALS}>{translate(locale, "All professionals")}</SelectItem>
              {professionals.map((name) => (
                <SelectItem key={name} value={name}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-[14px] text-muted">
            {visibleAppointments.length} {translate(locale, "appointments")}
          </span>
        </div>
      )}
      {[...groups.entries()].map(([date, items]) => (
        <section aria-label={date || translate(locale, "Daily appointments")} className="mb-8 last:mb-0" key={date || "day"}>
          {date && (
            <h3 className="mb-3 text-[14px] font-medium text-ink">
              {items[0]?.localDate}
            </h3>
          )}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {items.map((appointment) => {
              const tone = solidTone[toneFor(appointment.serviceName)];
              const dark = tone === solidTone.brand || tone === solidTone.ink;
              return (
                <div className="min-w-0" key={appointment.id}>
                  <time className="mb-2 block font-mono text-[14px] leading-[1.5] text-muted" dateTime={appointment.startAt}>
                    {appointment.localTime}
                  </time>
                  <Card className={cn("gap-0 rounded-card border-0 p-4 shadow-none ring-0", tone.bg, tone.fg)}>
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-heading">
                          <Link className="hover:underline" href={`/workspace/customers/${appointment.customerId}`}>
                            {appointment.customerName}
                          </Link>
                        </h3>
                        <p className={cn("mt-1 truncate text-[13px]", tone.sub)}>
                          {appointment.serviceName} · {appointment.professionalName}
                        </p>
                        {appointment.customerPhone && (
                          <a className={cn("mt-0.5 block text-[13px] hover:underline", tone.sub)} href={`tel:${appointment.customerPhone}`}>
                            {appointment.customerPhone}
                          </a>
                        )}
                      </div>
                      <Badge className="bg-white text-ink">{translate(locale, appointment.status)}</Badge>
                    </div>
                    <div className="mt-3.5">
                      <AppointmentActions
                        appointment={appointment}
                        currency={currency}
                        dark={dark}
                        disabled={busy}
                        onUpdate={update}
                      />
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
