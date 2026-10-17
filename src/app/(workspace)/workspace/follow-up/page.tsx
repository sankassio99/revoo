import Link from "next/link";
import { ArrowLeft, ArrowRight, ChatCircleDots } from "@phosphor-icons/react/dist/ssr";
import { getFollowUpCustomers } from "@/features/dashboard/dashboard.service";
import { getCurrentWorkspace } from "@/lib/auth/current-workspace";
import { getSessionUser } from "@/lib/auth/session";
import { formatLocalDate } from "@/lib/domain/time";
import { redirect } from "next/navigation";
import { getRequestLocale } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/messages";
import { formatNumber } from "@/lib/i18n/format";

export const dynamic = "force-dynamic";

export default async function FollowUpPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { workspace } = await getCurrentWorkspace(user);
  const locale = await getRequestLocale();
  if (!workspace) {
    return (
      <section className="py-12">
        <h1 className="text-3xl font-medium tracking-[-0.06em] text-ink">{translate(locale, "Follow-up")}</h1>
        <p className="mt-2 text-sm text-muted">{translate(locale, "Create a workspace to see customers who may be due for a return visit.")}</p>
      </section>
    );
  }
  const { intervalDays, customers } = await getFollowUpCustomers(user, workspace.tenantId);

  return (
    <div className="page-reveal">
      <Link className="inline-flex items-center gap-2 text-xs font-medium text-muted hover:text-forest" href="/workspace">
        <ArrowLeft size={14} /> {translate(locale, "Overview")}
      </Link>
      <div className="mt-6 flex flex-col justify-between gap-5 border-b border-line pb-7 sm:flex-row sm:items-end">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">{translate(locale, "A familiar face, remembered")}</p>
          <h1 className="mt-3 text-3xl font-medium tracking-[-0.065em] text-ink sm:text-[2.75rem]">{translate(locale, "Ready to reconnect")}</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
            {translate(locale, "Customers whose last completed visit was at least")} {formatNumber(intervalDays, locale)} {translate(locale, "days ago and who have current marketing permission.")}
          </p>
        </div>
        <span className="text-xs text-muted">{formatNumber(customers.length, locale)} {translate(locale, "people to check in with")}</span>
      </div>
      {customers.length ? (
        <ul className="divide-y divide-line border-b border-line">
          {customers.map((customer) => (
            <li className="flex flex-wrap items-center gap-4 py-5" key={customer.id}>
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#e9e2d7] text-sm font-medium text-forest">
                {customer.name.slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <Link className="block truncate text-sm font-medium text-ink hover:text-forest" href={`/workspace/customers/${customer.id}`}>
                  {customer.name}
                </Link>
                <p className="mt-1 text-xs text-muted">
                  {translate(locale, "Last completed visit")} {customer.lastVisitAt ? formatLocalDate(customer.lastVisitAt, workspace.timeZone, locale) : translate(locale, "not available")}
                </p>
              </div>
              <Link className="inline-flex min-h-9 items-center gap-2 rounded-full border border-line bg-white px-3.5 text-xs font-medium text-forest hover:border-forest/40" href={`/workspace/customers/${customer.id}`}>
                <ChatCircleDots size={15} /> {translate(locale, "Contact details")} <ArrowRight size={13} />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex min-h-64 flex-col items-center justify-center border-b border-line px-4 text-center">
          <span className="grid size-11 place-items-center rounded-full bg-forest-soft text-forest"><ChatCircleDots size={19} /></span>
          <p className="mt-4 text-sm font-medium text-ink">{translate(locale, "No follow-ups due right now")}</p>
          <p className="mt-1 max-w-md text-xs leading-5 text-muted">
            {translate(locale, "A customer appears here after a completed visit, when the workspace interval has passed and current marketing permission is recorded.")}
          </p>
        </div>
      )}
    </div>
  );
}
