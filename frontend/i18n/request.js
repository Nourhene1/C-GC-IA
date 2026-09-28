import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

export const locales = ["fr", "en"];
export const defaultLocale = "fr";

export default getRequestConfig(async () => {
  const store = await cookies();
  const cookieLocale = store.get("NEXT_LOCALE")?.value;
  const locale = locales.includes(cookieLocale) ? cookieLocale : defaultLocale;

  return {
    locale,
    timeZone: "Africa/Tunis", // toutes les dates s'affichent à l'heure de Tunis
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
