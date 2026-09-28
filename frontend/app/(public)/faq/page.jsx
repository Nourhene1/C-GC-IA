import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { MessageCircleQuestion } from "lucide-react";
import PageHero from "@/components/public/PageHero";
import FaqList from "@/components/public/FaqList";
import { serverApi } from "@/lib/server-api";

export async function generateMetadata() {
  const t = await getTranslations("faq");
  return { title: t("title") };
}

// F3.3 : foire aux questions
export default async function FaqPage() {
  const t = await getTranslations("faq");
  const data = await serverApi("/api/faq");

  return (
    <>
      <PageHero title={t("title")} subtitle={t("subtitle")} />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <FaqList faqs={data?.faqs || []} />

        <div className="mt-10 flex flex-col items-center gap-3 rounded-3xl bg-primary p-8 text-center text-white">
          <MessageCircleQuestion className="size-9 text-accent" />
          <p className="font-bold">{t("notFound")}</p>
          <Link href="/contact" className="rounded-xl bg-accent px-5 py-2.5 font-semibold transition hover:bg-white hover:text-primary">
            {t("contactUs")}
          </Link>
        </div>
      </div>
    </>
  );
}
