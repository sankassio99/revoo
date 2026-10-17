import { getRequestLocale } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/messages";

export default async function WorkspaceLoading() {
  const locale = await getRequestLocale();

  return (
    <div aria-label={translate(locale, "Loading your workspace")} className="page-reveal">
      <div className="h-3 w-28 rounded-full soft-shimmer" />
      <div className="mt-4 h-11 w-72 max-w-full rounded-lg soft-shimmer" />
      <div className="mt-3 h-4 w-52 rounded-full soft-shimmer" />
      <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-8 border-y border-line py-6 sm:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="space-y-3" key={index}>
            <div className="h-3 w-24 rounded-full soft-shimmer" />
            <div className="h-9 w-14 rounded-lg soft-shimmer" />
          </div>
        ))}
      </div>
      <div className="mt-10 h-6 w-56 rounded-lg soft-shimmer" />
      <div className="mt-5 divide-y divide-line border-y border-line">
        {Array.from({ length: 3 }, (_, index) => (
          <div className="flex items-center gap-5 py-5" key={index}>
            <div className="h-4 w-12 rounded-full soft-shimmer" />
            <div className="h-9 flex-1 rounded-lg soft-shimmer" />
          </div>
        ))}
      </div>
    </div>
  );
}
