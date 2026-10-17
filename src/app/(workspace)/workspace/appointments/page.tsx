import Link from "next/link";
import { CalendarBlank, CaretLeft, CaretRight } from "@phosphor-icons/react/dist/ssr";
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
import { formatNumber } from "@/lib/i18n/format";

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
      <div className="flex flex-col justify-between gap-5 border-b border-line pb-7 sm:flex-row sm:items-end">
        <div>
          <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
            <CalendarBlank size={14} /> {translate(locale, "Find a little rhythm")}
          </p>
          <h1 className="mt-3 text-3xl font-medium tracking-[-0.065em] text-ink sm:text-[2.75rem]">{translate(locale, "Appointments")}</h1>
          <p className="mt-2 text-sm text-muted">{rangeTitle} <span className="px-1 text-line">·</span> {workspace.timeZone}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link aria-label={translate(locale, "Previous period")} className="grid size-10 place-items-center rounded-full border border-line bg-white text-muted hover:text-forest" href={dateHref(previousDate)}>
            <CaretLeft size={16} />
          </Link>
          <Link className="min-h-10 rounded-full border border-line bg-white px-4 py-3 text-xs font-medium text-ink hover:border-forest/40" href={dateHref(today)}>
            {translate(locale, "Today")}
          </Link>
          <Link aria-label={translate(locale, "Next period")} className="grid size-10 place-items-center rounded-full border border-line bg-white text-muted hover:text-forest" href={dateHref(nextDate)}>
            <CaretRight size={16} />
          </Link>
          <Link className="ml-2 text-xs font-medium text-muted hover:text-forest" href={dateHref(date, view === "day" ? "week" : "day")}>
            {translate(locale, view === "day" ? "Week" : "Day")} {translate(locale, "view")}
          </Link>
        </div>
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

      <section aria-label={`${translate(locale, view)} ${translate(locale, "appointment calendar")}`} className="pt-7">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-accent">{translate(locale, view === "day" ? "One day at a time" : "The week ahead")}</p>
            <h2 className="mt-2 text-xl font-medium tracking-[-0.05em] text-ink">{translate(locale, view === "day" ? "Daily schedule" : "Weekly schedule")}</h2>
          </div>
          <span className="text-xs text-muted">{formatNumber(calendarItems.length, locale)} {translate(locale, "appointments")}</span>
        </div>
        <AppointmentCalendar appointments={calendarItems} currency={workspace.currency} tenantId={workspace.tenantId} view={view} />
      </section>
    </div>
  );
}
