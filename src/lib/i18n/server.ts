import "server-only";

import { cookies, headers } from "next/headers";
import {
  languagePreferenceCookie,
  parseAcceptLanguage,
  resolveLocale,
} from "@/lib/i18n/locale";

export async function getRequestLocale() {
  const [cookieStore, requestHeaders] = await Promise.all([cookies(), headers()]);
  const explicitLocale = cookieStore.get(languagePreferenceCookie)?.value;
  const browserLanguages = parseAcceptLanguage(
    requestHeaders.get("accept-language"),
  );

  return resolveLocale(explicitLocale, browserLanguages);
}
