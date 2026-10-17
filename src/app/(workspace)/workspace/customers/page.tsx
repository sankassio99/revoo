import Link from "next/link";
import { redirect } from "next/navigation";
import { MagnifyingGlass, UserPlus, UsersThree } from "@phosphor-icons/react/dist/ssr";
import { CustomerForm } from "@/features/customers/customer-form";
import { listCustomers } from "@/features/customers/customer.service";
import { getCurrentWorkspace } from "@/lib/auth/current-workspace";
import { getSessionUser } from "@/lib/auth/session";
import { getRequestLocale } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/messages";
import { formatNumber } from "@/lib/i18n/format";

export const dynamic = "force-dynamic";

type PageProps = { searchParams: Promise<{ q?: string }> };

export default async function CustomersPage({ searchParams }: PageProps) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { workspace } = await getCurrentWorkspace(user);
  const locale = await getRequestLocale();
  const { q = "" } = await searchParams;
  const query = q.trim().slice(0, 80);
  const customers = workspace ? await listCustomers(user, workspace.tenantId, query) : [];

  return (
    <div className="page-reveal">
      <div className="flex flex-col justify-between gap-5 border-b border-line pb-7 sm:flex-row sm:items-end">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">{translate(locale, "The people behind the work")}</p>
          <h1 className="mt-3 text-3xl font-medium tracking-[-0.065em] text-ink sm:text-[2.75rem]">{translate(locale, "Customers")}</h1>
          <p className="mt-2 text-sm text-muted">{translate(locale, "A thoughtful record of the people you care for.")}</p>
        </div>
        <form action="/workspace/customers" className="flex w-full gap-2 sm:max-w-sm">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">{translate(locale, "Search by name or phone")}</span>
            <MagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={16} />
            <input
              className="min-h-11 w-full rounded-full border border-line bg-white pl-10 pr-4 text-sm outline-none transition focus:border-forest focus:ring-2 focus:ring-forest/10"
              defaultValue={query}
              name="q"
              placeholder={translate(locale, "Search name or phone")}
              type="search"
            />
          </label>
          <button className="min-h-11 rounded-full border border-line px-4 text-xs font-medium text-ink transition hover:bg-white" type="submit">
            {translate(locale, "Search")}
          </button>
        </form>
      </div>

      {workspace ? (
        <>
          <section aria-labelledby="add-customer-heading" className="border-b border-line py-7">
            <div className="mb-5 flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-full bg-[#e5ebe5] text-forest">
                <UserPlus size={17} />
              </span>
              <div>
                <h2 className="text-sm font-medium text-ink" id="add-customer-heading">{translate(locale, "Add someone new")}</h2>
                <p className="mt-1 text-xs text-muted">{translate(locale, "Possible duplicates are flagged, never merged automatically.")}</p>
              </div>
            </div>
            <CustomerForm tenantId={workspace.tenantId} />
          </section>

          <section aria-labelledby="customer-list-heading" className="pt-7">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-accent">{translate(locale, "Your community")}</p>
                <h2 className="mt-2 text-xl font-medium tracking-[-0.05em] text-ink" id="customer-list-heading">
                  {translate(locale, query ? "Search results" : "All customers")}
                </h2>
              </div>
              <span className="text-xs text-muted">{formatNumber(customers.length, locale)}{customers.length === 100 ? "+" : ""} {translate(locale, "people")}</span>
            </div>

            {customers.length > 0 ? (
              <ul className="mt-5 divide-y divide-line border-y border-line">
                {customers.map((customer) => (
                  <li className="flex items-center gap-4 py-4" key={customer.id}>
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#e9e2d7] text-xs font-semibold text-forest">
                      {customer.name.slice(0, 1).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <Link className="block truncate text-sm font-medium text-ink hover:text-forest" href={`/workspace/customers/${customer.id}`}>
                        {customer.name}
                      </Link>
                      <p className="mt-1 truncate text-xs text-muted">{customer.phone}{customer.email ? ` · ${customer.email}` : ""}</p>
                    </div>
                    <span className="hidden text-xs text-muted sm:block">{translate(locale, customer.notes ? "Notes on file" : "Customer")}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-5 flex min-h-52 flex-col items-center justify-center border-y border-line px-4 text-center">
                <span className="grid size-11 place-items-center rounded-full bg-[#e5ebe5] text-forest">
                  <UsersThree size={19} />
                </span>
                <p className="mt-4 text-sm font-medium text-ink">{translate(locale, query ? "No customers found" : "Your customer list is ready")}</p>
                <p className="mt-1 max-w-sm text-xs leading-5 text-muted">
                  {translate(locale, query ? "Try a different name or phone number." : "Add your first customer above to keep their details and appointment history together.")}
                </p>
              </div>
            )}
          </section>
        </>
      ) : (
        <section className="flex min-h-64 flex-col items-center justify-center text-center">
          <p className="text-sm font-medium text-ink">{translate(locale, "Create a workspace to get started")}</p>
          <Link className="mt-4 text-xs font-medium text-forest underline underline-offset-4" href="/workspace/new">
            {translate(locale, "Set up your business")}
          </Link>
        </section>
      )}
    </div>
  );
}
