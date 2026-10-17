import Link from "next/link";
import { CatalogManager } from "@/features/catalog/catalog-manager";
import { listCatalog } from "@/features/catalog/catalog.service";
import { getCurrentWorkspace } from "@/lib/auth/current-workspace";
import { getSessionUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { getRequestLocale } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/messages";

export const dynamic = "force-dynamic";

export default async function CatalogPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { workspace } = await getCurrentWorkspace(user);
  const locale = await getRequestLocale();

  if (!workspace) {
    return (
      <section className="py-12">
        <h1 className="text-3xl font-medium tracking-[-0.06em] text-ink">{translate(locale, "Services and team")}</h1>
        <Link className="mt-4 inline-block text-sm text-forest underline underline-offset-4" href="/workspace/new">{translate(locale, "Create a workspace")}</Link>
      </section>
    );
  }

  const catalog = await listCatalog(user, workspace.tenantId);
  return (
    <div className="page-reveal">
      <div className="border-b border-line pb-7">
        <Link className="text-xs font-medium text-muted hover:text-forest" href="/workspace/settings">{translate(locale, "Business settings")}</Link>
        <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">{translate(locale, "The shape of your work")}</p>
        <h1 className="mt-2 text-3xl font-medium tracking-[-0.065em] text-ink sm:text-[2.75rem]">{translate(locale, "Services and team")}</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
          {translate(locale, "Keep your offerings and the people providing them current. Changes apply to future bookings; appointment snapshots stay unchanged.")}
        </p>
      </div>
      <div className="pt-7">
        <CatalogManager
          currency={workspace.currency}
          owner={workspace.role === "owner"}
          professionals={catalog.professionals}
          services={catalog.services}
          tenantId={workspace.tenantId}
        />
      </div>
    </div>
  );
}
