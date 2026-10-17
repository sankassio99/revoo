import Link from "next/link";
import { ArrowLeft, CalendarDots } from "@phosphor-icons/react/dist/ssr";
import { CustomerArchiveButton } from "@/features/customers/customer-archive-button";
import { CustomerForm } from "@/features/customers/customer-form";
import {
  getCustomerAppointmentHistory,
  getCustomer,
} from "@/features/customers/customer.service";
import { getCurrentWorkspace } from "@/lib/auth/current-workspace";
import { getSessionUser } from "@/lib/auth/session";
import { formatLocalDate, formatLocalTime } from "@/lib/domain/time";
import { notFound, redirect } from "next/navigation";
import { getRequestLocale } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/messages";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ customerId: string }> };

export default async function CustomerProfilePage({ params }: PageProps) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { workspace } = await getCurrentWorkspace(user);
  const locale = await getRequestLocale();
  if (!workspace) notFound();
  const { customerId } = await params;
  const [customer, appointments] = await Promise.all([
    getCustomer(user, workspace.tenantId, customerId),
    getCustomerAppointmentHistory(user, workspace.tenantId, customerId),
  ]);
  if (!customer || !appointments) notFound();

  return (
    <div className="page-reveal">
      <Link className="inline-flex items-center gap-2 text-xs font-medium text-muted transition hover:text-forest" href="/workspace/customers">
        <ArrowLeft size={14} /> {translate(locale, "Customers")}
      </Link>
      <div className="mt-6 flex flex-col justify-between gap-5 border-b border-line pb-7 sm:flex-row sm:items-end">
        <div className="flex items-center gap-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-full bg-[#e9e2d7] text-lg font-medium text-forest">
            {customer.name.slice(0, 1).toUpperCase()}
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">{translate(locale, "Customer profile")}</p>
            <h1 className="mt-2 text-3xl font-medium tracking-[-0.065em] text-ink">{customer.name}</h1>
          </div>
        </div>
        <CustomerArchiveButton customerId={customer.id} tenantId={workspace.tenantId} />
      </div>

      <div className="grid gap-10 pt-8 lg:grid-cols-[0.75fr_1.25fr]">
        <section aria-labelledby="contact-heading">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.17em] text-accent" id="contact-heading">{translate(locale, "Contact details")}</h2>
          <dl className="mt-4 divide-y divide-line border-y border-line">
            <div className="py-4">
              <dt className="text-[10px] uppercase tracking-[0.12em] text-muted">{translate(locale, "Phone")}</dt>
              <dd className="mt-1 text-sm text-ink">{customer.phone}</dd>
            </div>
            <div className="py-4">
              <dt className="text-[10px] uppercase tracking-[0.12em] text-muted">{translate(locale, "Email")}</dt>
              <dd className="mt-1 text-sm text-ink">{customer.email ?? translate(locale, "Not provided")}</dd>
            </div>
            <div className="py-4">
              <dt className="text-[10px] uppercase tracking-[0.12em] text-muted">{translate(locale, "Notes")}</dt>
              <dd className="mt-1 whitespace-pre-wrap text-sm leading-6 text-ink">{customer.notes || translate(locale, "No notes yet.")}</dd>
            </div>
            {[
              ["WhatsApp service messages", customer.communicationPreferences.whatsappService],
              ["WhatsApp marketing", customer.communicationPreferences.whatsappMarketing],
              ["Email marketing", customer.communicationPreferences.emailMarketing],
            ].map(([label, state]) => (
              <div className="py-4" key={label}>
                <dt className="text-[10px] uppercase tracking-[0.12em] text-muted">{translate(locale, label)}</dt>
                <dd className="mt-1 text-sm capitalize text-ink">{translate(locale, state)}</dd>
              </div>
            ))}
          </dl>
          {customer.communicationPreferences.whatsappService !== "denied" &&
            customer.phone.replace(/\D/g, "").length >= 7 && (
              <a
                className="mt-4 inline-flex min-h-10 items-center rounded-full border border-line bg-white px-4 text-xs font-medium text-forest hover:border-forest/40"
                href={`https://wa.me/${customer.phone.replace(/\D/g, "")}?text=${encodeURIComponent(translate(locale, `Hello ${customer.name}, this is ${workspace.name}.`))}`}
                rel="noreferrer"
                target="_blank"
              >
                {translate(locale, "Open WhatsApp conversation")}
              </a>
            )}
          <details className="mt-6 border-t border-line pt-4">
            <summary className="cursor-pointer text-xs font-medium text-forest">{translate(locale, "Edit customer details and preferences")}</summary>
            <div className="pt-4">
              <CustomerForm initial={customer} tenantId={workspace.tenantId} />
            </div>
          </details>
        </section>

        <section aria-labelledby="history-heading">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-accent">{translate(locale, "Visits and care")}</p>
              <h2 className="mt-2 text-xl font-medium tracking-[-0.05em] text-ink" id="history-heading">{translate(locale, "Appointment history")}</h2>
            </div>
            <CalendarDots className="text-forest" size={19} />
          </div>
          {appointments.length ? (
            <ul className="mt-5 divide-y divide-line border-y border-line">
              {appointments.map((appointment) => (
                <li className="flex items-center justify-between gap-4 py-4" key={appointment.id}>
                  <div>
                    <p className="text-sm font-medium text-ink">{appointment.serviceName}</p>
                    <p className="mt-1 text-xs text-muted">
                      {appointment.startAtUtc
                        ? `${formatLocalDate(appointment.startAtUtc, workspace.timeZone, locale)} · ${formatLocalTime(appointment.startAtUtc, workspace.timeZone, locale)}`
                        : translate(locale, "Date unavailable")}
                    </p>
                  </div>
                  <span className="rounded-full bg-forest-soft px-2.5 py-1 text-[10px] font-medium text-forest">
                    {translate(locale, appointment.status)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-5 border-y border-line py-8">
              <p className="text-sm font-medium text-ink">{translate(locale, "A fresh start")}</p>
              <p className="mt-1 text-xs leading-5 text-muted">{translate(locale, "Appointments with")} {customer.name} {translate(locale, "will be kept here.")}</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
