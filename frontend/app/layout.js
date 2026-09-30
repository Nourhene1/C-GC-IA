import { Montserrat } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { NotificationProvider } from "../context/NotificationContext";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-montserrat",
});

export async function generateMetadata() {
  const t = await getTranslations("common");

  return {
    title: t("metaTitle"),
    description: t("tagline"),
  };
}

export default async function RootLayout({ children }) {
  const locale = await getLocale();

  return (
    <html lang={locale} className={montserrat.variable}>
      <body className="font-sans">
        <NextIntlClientProvider>
          <NotificationProvider>
            {children}
          </NotificationProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}