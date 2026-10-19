import Link from "next/link";
import { ArrowRight, CalendarBlank, Clock, UsersThree } from "@phosphor-icons/react/dist/ssr";
import { AddButton } from "@/components/ui/add-button";
import { AppHeader } from "@/components/ui/app-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { SectionTitle } from "@/components/ui/section-title";
import { StatCard } from "@/components/ui/stat-card";
import { getCurrentWorkspace } from "@/lib/auth/current-workspace";
import { getSessionUser } from "@/lib/auth/session";
import { formatLocalDate, formatLocalTime } from "@/lib/domain/time";
import { getDashboardOverview } from "@/features/dashboard/dashboard.service";
import { getRequestLocale } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/messages";
import { formatCurrency, formatNumber } from "@/lib/i18n/format";

export const dynamic = "force-dynamic";

export default async function WorkspaceHomePage() {
  const user = await getSessionUser();
  if (!user) return null;

  const locale = await getRequestLocale();
  const { workspace, workspaces } = await getCurrentWorkspace(user);

  if (!workspace) {
    return (
      <section className="mx-auto flex min-h-[calc(100dvh-11rem)] max-w-[700px] flex-col justify-center py-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.19em] text-accent">
          {translate(locale, "A place of your own")}
        </p>
        <h1 className="mt-4 max-w-[550px] text-4xl font-medium leading-[1.02] tracking-[-0.07em] text-ink sm:text-6xl">
          {translate(locale, "Let's make room for your day.")}
        </h1>
        <p className="mt-5 max-w-[440px] text-sm leading-7 text-muted">
          {workspaces.length > 0
            ? translate(locale, "Choose a workspace above, or create a new one for another business.")
            : translate(locale, "Start with your business details. Your team and appointments will have a home here.")}
        </p>
        <div className="mt-8">
          <Link
            className="inline-flex min-h-12 items-center gap-3 rounded-full bg-forest px-6 text-sm font-medium text-white transition-all hover:-translate-y-px hover:bg-[#20483b] active:scale-[0.98]"
            href="/workspace/new"
          >
            {translate(locale, "Create a workspace")} <ArrowRight size={16} />
          </Link>
        </div>
        <div className="mt-16 grid grid-cols-1 divide-y divide-line border-y border-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {[
            { icon: UsersThree, label: "People, remembered" },
            { icon: CalendarBlank, label: "A day in rhythm" },
            { icon: Clock, label: "Time, well kept" },
          ].map(({ icon: Icon, label }, index) => (
            <div className="flex items-center gap-3 py-4 sm:px-4 first:sm:pl-0" key={label} style={{ "--index": index } as React.CSSProperties}>
              <Icon className="text-forest" size={18} />
              <span className="text-xs text-muted">{translate(locale, label)}</span>
            </div>
          ))}
        </div>
      </section>
    );
  }

  const overview = await getDashboardOverview(user, workspace.tenantId, workspace.timeZone, new Date(), locale);
  const {
    appointments: todayAppointments,
    statusCounts,
    totalAppointments,
    revenueMinorUnits,
    followUps,
    localDate,
  } = overview;
  const allStatuses = ["Scheduled", "Confirmed", "Completed", "Cancelled", "NoShow"] as const;

  return (
    <div className="-mx-4 -mt-7 -mb-10 min-h-dvh p-1.5 sm:-mx-7 sm:-mt-9 lg:-mx-10">
      <div className="page-reveal mx-auto flex min-h-[calc(100dvh-12px)] w-full flex-col rounded-[32px] bg-canvas px-5 pb-28 pt-5 text-ink">
        <AppHeader
          title={workspace.name}
          subtitle={translate(locale, "Your studio")}
          notifications={followUps.length > 0}
        />

        <div className="mt-6 flex items-end justify-between gap-3">
          <PageHeader title={translate(locale, "Dashboard")} subtitle={localDate} />
          <AddButton
            href="/workspace/appointments?new=1"
            aria-label={translate(locale, "Add an appointment")}
            className="!size-14 !min-h-14 !min-w-14 [&_svg]:!size-6"
          />
        </div>
        <p className="mt-2 text-[14px] leading-[1.5] text-muted">
          {translate(locale, "A clear view of what's ahead, with a little space to breathe between.")}
        </p>

        <section
          aria-label={translate(locale, "Today's overview")}
          className="mt-6 grid grid-cols-2 gap-2"
        >
          <StatCard
            label={translate(locale, "Appointments")}
            value={formatNumber(totalAppointments, locale)}
            caption={translate(locale, "on the calendar today")}
            tone="brand"
            className="min-h-[160px] p-5 [&>p:nth-of-type(1)]:text-[48px]"
          />
          <StatCard
            label={translate(locale, "Confirmed")}
            value={formatNumber(statusCounts.Confirmed, locale)}
            caption={translate(locale, "ready to welcome")}
            tone="leaf"
            className="min-h-[160px] p-5 [&>p:nth-of-type(1)]:text-[48px]"
          />
          <StatCard
            label={translate(locale, "Revenue")}
            value={formatCurrency(revenueMinorUnits / 100, workspace.currency, locale)}
            caption={`${formatNumber(statusCounts.Completed, locale)} ${translate(locale, "completed today")}`}
            tone="sun"
            className="min-h-[160px] p-5 [&>p:nth-of-type(1)]:text-[32px]"
          />
          <StatCard
            label={translate(locale, "Studio")}
            value={translate(locale, "Manage your studio")}
            caption={translate(locale, "Studio, services, and team")}
            tone="ink"
            href="/workspace/settings"
            icon={<ArrowRight aria-hidden="true" size={16} />}
            className="min-h-[160px] p-5"
          />
        </section>

        <section
          aria-label={translate(locale, "Appointment counts by status")}
          className="mt-4 flex flex-wrap gap-2"
        >
          {allStatuses.map((status) => (
            <Badge
              key={status}
              variant="secondary"
              className="min-h-10 bg-surface px-3.5 py-2 text-sm text-ink"
            >
              {translate(locale, status)} {formatNumber(statusCounts[status], locale)}
            </Badge>
          ))}
        </section>

        <section aria-label={translate(locale, "Today's appointments")} className="mt-8">
          <div className="flex items-end justify-between gap-3">
            <SectionTitle title={translate(locale, "Today's appointments")} />
            <Link
              className="inline-flex min-h-11 shrink-0 items-center gap-1.5 text-[13px] text-ink focus-visible:outline-2 focus-visible:outline-brand"
              href="/workspace/appointments"
            >
              {translate(locale, "Open calendar")} <ArrowRight aria-hidden="true" size={14} />
            </Link>
          </div>

          {todayAppointments.length > 0 ? (
            <div className="mt-3 flex flex-col gap-2">
              {todayAppointments.map((appointment) => (
                <Card key={appointment.id} className="flex min-w-0 items-center gap-3 p-3">
                  <time className="w-12 shrink-0 font-mono text-[13px] text-muted" dateTime={appointment.startAt.toISOString()}>
                    {formatLocalTime(appointment.startAt, workspace.timeZone, locale)}
                  </time>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm">{appointment.customer}</span>
                    <span className="block truncate text-caption text-muted">{appointment.service} · {appointment.professional}</span>
                  </span>
                  <Badge variant="secondary">{translate(locale, appointment.status)}</Badge>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="mt-3 p-4">
              <span className="grid size-10 place-items-center rounded-full bg-brand-soft text-brand-deep" aria-hidden="true">
                <CalendarBlank size={19} />
              </span>
              <h3 className="mt-3 text-base">{translate(locale, "Your day is open.")}</h3>
              <p className="mt-1 text-[13px] leading-5 text-muted">
                {translate(locale, "When you add an appointment, it will find its place here. Take this moment for yourself.")}
              </p>
              <Link
                className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-4 text-[13px] text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                href="/workspace/appointments?new=1"
              >
                {translate(locale, "Add an appointment")} <ArrowRight aria-hidden="true" size={14} />
              </Link>
            </Card>
          )}
        </section>

        <section aria-label={translate(locale, "Ready to reconnect")} className="mt-8">
          <div className="flex items-end justify-between gap-3">
            <SectionTitle title={translate(locale, "Ready to reconnect")} />
            <Link className="inline-flex min-h-11 items-center text-[13px] text-ink focus-visible:outline-2 focus-visible:outline-brand" href="/workspace/follow-up">
              {translate(locale, "View all")}
            </Link>
          </div>
          {followUps.length > 0 ? (
            <div className="mt-3 flex flex-col gap-2">
              {followUps.slice(0, 4).map((customer) => (
                <Link key={customer.id} className="block rounded-card bg-surface p-3 focus-visible:outline-2 focus-visible:outline-brand" href={`/workspace/customers/${customer.id}`}>
                  <span className="block truncate text-sm">{customer.name}</span>
                  <span className="mt-1 block text-caption text-muted">
                    {translate(locale, "Last visit")} {formatLocalDate(customer.lastVisitAt, workspace.timeZone, locale)}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="mt-3 p-4 text-[13px] leading-5 text-muted">
              {translate(locale, "Customers with a past visit and current marketing permission will appear here when it is time to check in.")}
            </Card>
          )}
          <p className="mt-4 text-caption text-muted">
            {translate(locale, "Showing appointments in")} {workspace.timeZone}. {translate(locale, "All information belongs to")} {workspace.name}.
          </p>
        </section>

        <p className="sr-only">
          {allStatuses.map((status) => `${translate(locale, status)}: ${formatNumber(statusCounts[status], locale)}`).join(", ")}
        </p>
      </div>
    </div>
  );
}
