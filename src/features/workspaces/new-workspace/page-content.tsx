import { CreateWorkspaceForm } from "@/features/workspaces/create-workspace-form";
import { getRequestLocale } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/messages";

export async function NewWorkspaceContent() {
  const locale = await getRequestLocale();

  return (
    <div className="grid min-h-[calc(100dvh-7rem)] grid-cols-1 items-center gap-12 py-10 lg:grid-cols-[0.75fr_1.25fr]">
      <div className="max-w-[420px]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.19em] text-accent">
          {translate(locale, "A place of your own")}
        </p>
        <h1 className="mt-5 text-4xl font-medium leading-[1.02] tracking-[-0.07em] text-ink sm:text-5xl">
          {translate(locale, "Start with the")}<br /> {translate(locale, "heart of it.")}
        </h1>
        <p className="mt-5 max-w-[360px] text-sm leading-7 text-muted">
          {translate(locale, "Create your business workspace. Your records, team, and day will stay yours.")}
        </p>
      </div>

      <section className="w-full max-w-[600px] rounded-[1.75rem] border border-line bg-white/75 p-5 sm:p-8 lg:justify-self-end">
        <p className="text-[11px] font-semibold uppercase tracking-[0.17em] text-forest">{translate(locale, "Workspace details")}</p>
        <h2 className="mt-2 text-xl font-medium tracking-[-0.045em] text-ink">
          {translate(locale, "Tell us where to begin.")}
        </h2>
        <CreateWorkspaceForm />
      </section>
    </div>
  );
}
