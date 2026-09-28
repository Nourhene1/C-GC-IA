import { getLocale, getTranslations } from "next-intl/server";
import { FileDown, FileText } from "lucide-react";
import PageHero from "@/components/public/PageHero";
import RichText from "@/components/public/RichText";
import { serverApi, publicFileUrl } from "@/lib/server-api";
import { pick } from "@/lib/content";

export async function generateMetadata() {
  const t = await getTranslations("rules");
  return { title: t("title") };
}

// F3.1 : règlement officiel, consultable en ligne et téléchargeable en PDF
export default async function RulesPage() {
  const t = await getTranslations("rules");
  const locale = await getLocale();
  const data = await serverApi("/api/content");
  const rules = data?.content?.rules;
  const text = pick(rules?.content, locale);

  return (
    <>
      <PageHero title={t("title")} subtitle={t("subtitle")} />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1fr_280px]">
        <article className="min-w-0 rounded-3xl bg-white p-6 shadow-lg shadow-primary/5 sm:p-10">
          {text ? <RichText text={text} /> : <p className="text-slate-500">{t("empty")}</p>}
        </article>

        {rules?.pdf && (
          <aside className="h-fit rounded-3xl bg-primary p-6 text-white lg:sticky lg:top-24">
            <FileText className="size-10 text-accent" />
            <p className="mt-3 font-bold">{t("pdfTitle")}</p>
            <p className="mt-1 break-all text-sm text-white/70">{rules.pdfName}</p>
            <a href={publicFileUrl(rules.pdf)} target="_blank" rel="noopener noreferrer" download
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 font-semibold text-white transition hover:bg-white hover:text-primary">
              <FileDown className="size-5" /> {t("download")}
            </a>
          </aside>
        )}
      </div>
    </>
  );
}
