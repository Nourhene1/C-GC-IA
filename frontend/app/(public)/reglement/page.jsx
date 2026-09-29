import { getLocale, getTranslations } from "next-intl/server";
import {
  FileDown,
  FileText,
  Scale,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
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

  const sections = text
    ? text
        .split(/\n(?=##\s)/)
        .map((section) => section.trim())
        .filter(Boolean)
    : [];

  return (
    <>
      <PageHero title={t("title")} subtitle={t("subtitle")} />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {sections.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2">
            {sections.map((section, index) => {
              const lines = section.split("\n");
              const titleLine = lines.find((line) =>
                line.startsWith("## ")
              );

              const title = titleLine
                ? titleLine.replace(/^##\s+/, "").trim()
                : `${t("rule")} ${index + 1}`;

              const content = lines
                .filter((line) => !line.startsWith("## "))
                .join("\n")
                .trim();

              return (
                <article
                  key={index}
                  className="group relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-lg shadow-primary/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10 sm:p-7"
                >
                  <div className="absolute right-0 top-0 h-24 w-24 rounded-bl-full bg-primary/[0.04] transition-all duration-300 group-hover:bg-accent/[0.08]" />

                  <div className="relative">
                    <div className="mb-5 flex items-start justify-between gap-4">
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-lg font-bold text-white shadow-md shadow-primary/20 transition-colors group-hover:bg-accent">
                        {String(index + 1).padStart(2, "0")}
                      </div>

                      <div className="flex size-10 items-center justify-center rounded-xl bg-slate-50 text-primary transition-colors group-hover:bg-accent/10 group-hover:text-accent">
                        <Scale className="size-5" />
                      </div>
                    </div>

                    <h2 className="flex items-start gap-2 text-xl font-bold leading-snug text-primary">
                      <ChevronRight className="mt-1 size-5 shrink-0 text-accent" />
                      <span>{title}</span>
                    </h2>

                    <div className="mt-5 border-t border-slate-100 pt-5">
                      <RichText text={content} />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl bg-white p-10 text-center shadow-lg shadow-primary/5">
            <ShieldCheck className="mx-auto size-12 text-slate-300" />
            <p className="mt-4 text-slate-500">{t("empty")}</p>
          </div>
        )}

        {rules?.pdf && (
          <section className="mt-10 overflow-hidden rounded-3xl bg-primary shadow-xl shadow-primary/10">
            <div className="relative p-6 sm:p-8">
              <div className="absolute -right-10 -top-10 size-40 rounded-full bg-accent/10" />
              <div className="absolute -bottom-16 -left-10 size-40 rounded-full bg-white/5" />

              <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                    <FileText className="size-7 text-accent" />
                  </div>

                  <div className="min-w-0">
                    <h2 className="text-xl font-bold text-white">
                      {t("pdfTitle")}
                    </h2>

                    <p className="mt-1 break-all text-sm text-white/60">
                      {rules.pdfName}
                    </p>
                  </div>
                </div>

                <a
                  href={publicFileUrl(rules.pdf)}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3.5 font-semibold text-white shadow-lg shadow-accent/20 transition-all duration-200 hover:bg-white hover:text-primary"
                >
                  <FileDown className="size-5" />
                  {t("download")}
                </a>
              </div>
            </div>
          </section>
        )}
      </main>
    </>
  );
}
