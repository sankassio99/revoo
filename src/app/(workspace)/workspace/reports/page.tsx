import { getRequestLocale } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/messages";

export default async function ReportsPage() {
  const locale = await getRequestLocale();

  return (
    <section className="page-reveal">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
        {translate(locale, "Workspace")}
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-[-0.06em] text-forest">
        {translate(locale, "Reports")}
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
        {translate(locale, "Reports will appear here when they are available for your workspace.")}
      </p>
    </section>
  );
}
