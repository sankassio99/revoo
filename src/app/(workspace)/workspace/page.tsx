import Link from "next/link";
import { ArrowRight, CalendarBlank, Clock, UserPlus, UsersThree } from "@phosphor-icons/react/dist/ssr";
import { PresenceDot } from "@/features/navigation/presence-dot";
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
    hasActiveCustomers,
    followUps,
    localDate,
  } = overview;
  const allStatuses = ["Scheduled", "Confirmed", "Completed", "Cancelled", "NoShow"];

  return (
    <div className="page-reveal">
      <div className="flex flex-col justify-between gap-5 border-b border-line pb-7 sm:flex-row sm:items-end">
        <div>
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-forest">
            <PresenceDot /> {translate(locale, "Your studio, today")}
          </p>
          <h1 className="mt-3 text-3xl font-medium leading-tight tracking-[-0.065em] text-ink sm:text-[2.75rem]">
            {translate(locale, "A good morning")}{user.displayName ? `, ${user.displayName.split(" ")[0]}` : ""}.
          </h1>
          <p className="mt-2 text-sm text-muted">{localDate}</p>
        </div>
        <p className="max-w-[300px] text-sm leading-6 text-muted">
          {translate(locale, "A clear view of what's ahead, with a little space to breathe between.")}
        </p>
      </div>

      <section aria-label={translate(locale, "Today's overview")} className="grid grid-cols-2 divide-x divide-y divide-line border-b border-line sm:grid-cols-4 sm:divide-y-0">
        <div className="py-5 pr-4 sm:py-7">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">{translate(locale, "Appointments")}</p>
          <p className="mt-3 font-mono text-3xl tracking-[-0.07em] text-ink">{formatNumber(totalAppointments, locale)}</p>
          <p className="mt-1 text-[11px] text-muted">{translate(locale, "on the calendar today")}</p>
        </div>
        <div className="py-5 pl-4 pr-4 sm:px-6 sm:py-7">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">{translate(locale, "Confirmed")}</p>
          <p className="mt-3 font-mono text-3xl tracking-[-0.07em] text-ink">{formatNumber(statusCounts.Confirmed ?? 0, locale)}</p>
          <p className="mt-1 text-[11px] text-muted">{translate(locale, "ready to welcome")}</p>
        </div>
        <div className="py-5 pr-4 sm:px-6 sm:py-7">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">{translate(locale, "Revenue")}</p>
          <p className="mt-3 font-mono text-2xl tracking-[-0.07em] text-ink">{formatCurrency(revenueMinorUnits / 100, workspace.currency, locale)}</p>
          <p className="mt-1 text-[11px] text-muted">{formatNumber(statusCounts.Completed, locale)} {translate(locale, "completed today")}</p>
        </div>
        <div className="py-5 pl-4 sm:py-7 sm:pl-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">{translate(locale, "People")}</p>
          <p className="mt-3 font-mono text-3xl tracking-[-0.07em] text-ink">{hasActiveCustomers ? translate(locale, "Here") : "—"}</p>
          <p className="mt-1 text-[11px] text-muted">
            {translate(locale, hasActiveCustomers ? "in your studio's care" : "ready to meet your first")}
          </p>
        </div>
      </section>

      <section aria-label={translate(locale, "Appointment counts by status")} className="grid grid-cols-2 gap-x-5 border-b border-line py-4 sm:grid-cols-5">
        {allStatuses.map((status) => (
          <div className="flex items-center justify-between gap-3 py-1" key={status}>
            <span className="text-[10px] text-muted">{translate(locale, status)}</span>
            <span className="font-mono text-xs text-ink">{formatNumber(statusCounts[status as keyof typeof statusCounts], locale)}</span>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-10 pt-8 lg:grid-cols-[1.35fr_0.65fr] lg:gap-14 lg:pt-10">
        <section aria-labelledby="today-title">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-accent">{translate(locale, "The flow of today")}</p>
              <h2 className="mt-2 text-xl font-medium tracking-[-0.05em] text-ink" id="today-title">
                {translate(locale, "Today's appointments")}
              </h2>
            </div>
            <Link className="inline-flex items-center gap-1.5 text-xs font-medium text-forest transition-colors hover:text-accent" href="/workspace/appointments">
              {translate(locale, "Open calendar")} <ArrowRight size={14} />
            </Link>
          </div>

          {todayAppointments.length > 0 ? (
            <div className="cascade mt-6 divide-y divide-line border-y border-line">
              {todayAppointments.map((appointment, index) => (
                <article
                  className="grid grid-cols-[58px_1fr_auto] items-center gap-3 py-4 sm:grid-cols-[76px_1fr_auto] sm:gap-5"
                  key={appointment.id}
                  style={{ "--index": index } as React.CSSProperties}
                >
                  <time className="font-mono text-xs text-muted" dateTime={appointment.startAt.toISOString()}>
                    {formatLocalTime(appointment.startAt, workspace.timeZone, locale)}
                  </time>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-medium text-ink">{appointment.customer}</h3>
                    <p className="mt-1 truncate text-xs text-muted">
                      {appointment.service} <span className="px-1 text-line">·</span> {appointment.professional}
                    </p>
                  </div>
                  <span className="rounded-full bg-forest-soft px-2.5 py-1 text-[10px] font-medium text-forest">
                    {translate(locale, appointment.status)}
                  </span>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-6 border-y border-line py-10">
              <span className="grid size-10 place-items-center rounded-xl bg-forest-soft text-forest">
                <CalendarBlank size={19} />
              </span>
              <h3 className="mt-4 text-sm font-medium text-ink">{translate(locale, "Your day is open.")}</h3>
              <p className="mt-1 max-w-[360px] text-xs leading-5 text-muted">
                {translate(locale, "When you add an appointment, it will find its place here. Take this moment for yourself.")}
              </p>
              <Link
                className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-full border border-line bg-white px-4 text-xs font-medium text-forest transition-colors hover:border-forest/30 active:scale-[0.98]"
                href="/workspace/appointments?new=1"
              >
                {translate(locale, "Add an appointment")} <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </section>

        <aside aria-labelledby="notes-title" className="border-t border-line pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-accent">{translate(locale, "A small reminder")}</p>
          <h2 className="mt-2 text-xl font-medium tracking-[-0.05em] text-ink" id="notes-title">
            {translate(locale, "Care is in the details.")}
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            {translate(locale, "A well-kept customer note or a thoughtful follow-up can turn a visit into a familiar ritual.")}
          </p>

          <div className="mt-7 border-y border-line">
            <Link
              className="group flex items-center gap-4 py-4"
              href="/workspace/customers"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
                <UsersThree size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-medium text-ink">{translate(locale, "Your customers")}</span>
                <span className="mt-1 block text-[11px] text-muted">{translate(locale, "Keep the little things close")}</span>
              </span>
              <ArrowRight className="text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-forest" size={15} />
            </Link>
            <Link
              className="group flex items-center gap-4 border-t border-line py-4"
              href="/workspace/settings"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-forest-soft text-forest">
                <UserPlus size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-medium text-ink">{translate(locale, "Make it your own")}</span>
                <span className="mt-1 block text-[11px] text-muted">{translate(locale, "Set up services and your team")}</span>
              </span>
              <ArrowRight className="text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-forest" size={15} />
            </Link>
          </div>

          <div className="mt-7">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-accent">{translate(locale, "Thoughtful follow-up")}</p>
                  <h3 className="mt-2 text-sm font-medium text-ink">{translate(locale, "Ready to reconnect")}</h3>
              </div>
              <Link className="text-[11px] font-medium text-forest hover:underline" href="/workspace/follow-up">{translate(locale, "View all")}</Link>
            </div>
            {followUps.length ? (
              <ul className="mt-3 divide-y divide-line border-y border-line">
                {followUps.slice(0, 4).map((customer) => (
                  <li className="py-3" key={customer.id}>
                    <Link className="block truncate text-xs font-medium text-ink hover:text-forest" href={`/workspace/customers/${customer.id}`}>
                      {customer.name}
                    </Link>
                    <p className="mt-1 text-[10px] text-muted">
                      {translate(locale, "Last visit")} {formatLocalDate(customer.lastVisitAt, workspace.timeZone, locale)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-xs leading-5 text-muted">
                {translate(locale, "Customers with a past visit and current marketing permission will appear here when it is time to check in.")}
              </p>
            )}
          </div>

          <p className="mt-6 text-[10px] leading-5 text-muted">
            {translate(locale, "Showing appointments in")} {workspace.timeZone}. {translate(locale, "All information belongs to")} {workspace.name}.
          </p>
        </aside>
      </div>
      <p className="sr-only">{allStatuses.map((status) => `${translate(locale, status)}: ${formatNumber(statusCounts[status as keyof typeof statusCounts], locale)}`).join(", ")}</p>
    </div>
  );
}
