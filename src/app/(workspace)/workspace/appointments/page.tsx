import Link from "next/link";
import { CaretLeft, CaretRight } from "@phosphor-icons/react/dist/ssr";
import { AddButton } from "@/components/ui/add-button";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { AppointmentWeekStrip } from "@/features/appointments/appointment-week-strip";
import { AppointmentCalendar, type CalendarAppointment } from "@/features/appointments/appointment-calendar";
import { AppointmentForm } from "@/features/appointments/appointment-form";
import { listAppointments } from "@/features/appointments/appointment.service";
import { listCatalog } from "@/features/catalog/catalog.service";
import { listCustomers } from "@/features/customers/customer.service";
import { formatLocalDate, formatLocalTime, getLocalDateTime, getLocalDayBounds, localDateTimeToUtc } from "@/lib/domain/time";
import { getCurrentWorkspace } from "@/lib/auth/current-workspace";
import { getSessionUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { getRequestLocale } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/messages";

export const dynamic = "force-dynamic";

type PageProps = { searchParams: Promise<{ date?: string; view?: string; new?: string }> };

function addCalendarDays(date: string, days: number) {
  const [year, month, day] = date.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}-${String(next.getUTCDate()).padStart(2, "0")}`;
}

function isCalendarDate(value: string | undefined): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export default async function AppointmentsPage({ searchParams }: PageProps) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { workspace } = await getCurrentWorkspace(user);
  const locale = await getRequestLocale();
  const { date: requestedDate, view: requestedView, new: newAppointment } = await searchParams;

  if (!workspace) {
    return (
      <section className="py-12">
        <h1 className="text-3xl font-medium tracking-[-0.06em] text-ink">{translate(locale, "Appointments")}</h1>
        <p className="mt-2 text-sm text-muted">{translate(locale, "Create a workspace before building your calendar.")}</p>
        <Link className="mt-4 inline-block text-sm text-forest underline underline-offset-4" href="/workspace/new">{translate(locale, "Create a workspace")}</Link>
      </section>
    );
  }

  const today = getLocalDateTime(new Date(), workspace.timeZone).slice(0, 10);
  const date = isCalendarDate(requestedDate) ? requestedDate : today;
  const view = requestedView === "week" ? "week" : "day";
  const selectedLocal = localDateTimeToUtc(`${date}T12:00`, workspace.timeZone);
  let rangeStart: Date;
  let rangeEnd: Date;
  let rangeTitle: string;
  if (view === "week") {
    const calendarWeekday = new Date(`${date}T00:00:00.000Z`).getUTCDay();
    const startDay = addCalendarDays(date, -calendarWeekday);
    const endDay = addCalendarDays(startDay, 7);
    rangeStart = getLocalDayBounds(localDateTimeToUtc(`${startDay}T12:00`, workspace.timeZone), workspace.timeZone).start;
    rangeEnd = getLocalDayBounds(localDateTimeToUtc(`${endDay}T12:00`, workspace.timeZone), workspace.timeZone).start;
    rangeTitle = `${formatLocalDate(rangeStart, workspace.timeZone, locale)} – ${formatLocalDate(new Date(rangeEnd.getTime() - 1), workspace.timeZone, locale)}`;
  } else {
    const bounds = getLocalDayBounds(selectedLocal, workspace.timeZone);
    rangeStart = bounds.start;
    rangeEnd = bounds.end;
    rangeTitle = formatLocalDate(rangeStart, workspace.timeZone, locale);
  }

  const [appointments, customers, catalog] = await Promise.all([
    listAppointments(user, workspace.tenantId, rangeStart, rangeEnd),
    listCustomers(user, workspace.tenantId),
    listCatalog(user, workspace.tenantId),
  ]);
  const professionalsById = new Map(catalog.professionals.map((professional) => [professional.id, professional.name]));
  const calendarItems: CalendarAppointment[] = appointments.map((appointment) => ({
    id: appointment.id,
    customerId: appointment.customerId,
    customerName: appointment.customerName,
    customerEmail: appointment.customerEmail,
    customerPhone: appointment.customerPhone,
    serviceName: appointment.serviceName,
    professionalName: professionalsById.get(appointment.professionalId) ?? translate(locale, "Team member"),
    startAt: appointment.startAt.toISOString(),
    endAt: appointment.endAt.toISOString(),
    localStart: getLocalDateTime(appointment.startAt, workspace.timeZone),
    localTime: formatLocalTime(appointment.startAt, workspace.timeZone, locale),
    localDate: formatLocalDate(appointment.startAt, workspace.timeZone, locale),
    status: appointment.status,
    amountChargedMinorUnits: appointment.amountChargedMinorUnits,
    priceMinorUnits: appointment.priceMinorUnits,
  }));
  const previousDate = addCalendarDays(date, view === "week" ? -7 : -1);
  const nextDate = addCalendarDays(date, view === "week" ? 7 : 1);
  const dateHref = (targetDate: string, targetView = view) =>
    `/workspace/appointments?date=${targetDate}&view=${targetView}`;

  return (
    <div className="page-reveal">
      <PageHeader
        action={
          <AddButton
            aria-label={translate(locale, "Add an appointment")}
            className="!size-14 !min-h-14 !min-w-14 [&_svg]:!size-6"
            href={`/workspace/appointments?date=${date}&view=${view}&new=1`}
          />
        }
        subtitle={`${rangeTitle} · ${workspace.timeZone}`}
        title={translate(locale, view === "day" ? "Daily schedule" : "Weekly schedule")}
      />

      <div className="mt-6">
        <AppointmentWeekStrip date={date} view={view} />
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button aria-label={translate(locale, "Previous period")} href={dateHref(previousDate)} size="icon-sm" variant="outline">
            <CaretLeft size={16} />
          </Button>
          <Button href={dateHref(today)} size="sm" variant="outline">{translate(locale, "Today")}</Button>
          <Button aria-label={translate(locale, "Next period")} href={dateHref(nextDate)} size="icon-sm" variant="outline">
            <CaretRight size={16} />
          </Button>
        </div>
        <Button href={dateHref(date, view === "day" ? "week" : "day")} size="sm" variant="ghost">
          {translate(locale, view === "day" ? "Week" : "Day")} {translate(locale, "view")}
        </Button>
      </div>

      <AppointmentForm
        customers={customers.map(({ id, name }) => ({ id, name }))}
        defaultLocalStart={`${date}T09:00`}
        defaultOpen={newAppointment === "1"}
        professionals={catalog.professionals
          .filter((professional) => professional.status === "active")
          .map(({ id, name, serviceIds }) => ({ id, name, serviceIds }))}
        services={catalog.services.filter((service) => service.status === "active").map(({ id, name }) => ({ id, name }))}
        tenantId={workspace.tenantId}
      />

      <section aria-label={`${translate(locale, view)} ${translate(locale, "appointment calendar")}`}       className="pt-6">        <AppointmentCalendar appointments={calendarItems} currency={workspace.currency} tenantId={workspace.tenantId} view={view} />
      </section>
    </div>
  );
}
