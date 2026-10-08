import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations, getFormatter } from "next-intl/server";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { CATEGORY_STYLES } from "@/components/public/NewsCard";
import NewsVideo from "@/components/public/NewsVideo";
import { serverApi } from "@/lib/server-api";
import { pick } from "@/lib/content";

// Titre de l'onglet = titre de l'annonce
export async function generateMetadata({ params }) {
  const { id } = await params;
  const data = await serverApi(`/api/news/${id}`);
  const locale = await getLocale();
  return data ? { title: pick(data.news.title, locale) } : {};
}

export default async function NewsDetailPage({ params }) {
  const { id } = await params;
  const t = await getTranslations("news");
  const locale = await getLocale();
  const format = await getFormatter();

  const data = await serverApi(`/api/news/${id}`);
  if (!data) notFound(); // introuvable, brouillon ou pas encore publiée
  const { news } = data;

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/news" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-accent">
        <ArrowLeft className="size-4" /> {t("back")}
      </Link>

      <div className="mt-6 rounded-3xl bg-white p-6 shadow-xl shadow-primary/5 sm:p-10">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${CATEGORY_STYLES[news.category]}`}>
            {t(`categories.${news.category}`)}
          </span>
          <time dateTime={news.publishAt} className="inline-flex items-center gap-1 text-slate-500">
            <CalendarDays className="size-4" />
            {format.dateTime(new Date(news.publishAt), { dateStyle: "long", timeStyle: "short" })}
          </time>
        </div>
        <h1 className="mt-4 text-3xl font-extrabold leading-tight text-primary">{pick(news.title, locale)}</h1>
        {/* whitespace-pre-line : garde les retours à la ligne saisis par l'admin */}
        <div className="mt-6 whitespace-pre-line leading-relaxed text-ink">{pick(news.content, locale)}</div>

        <NewsVideo video={news.video} />
      </div>
    </article>
  );
}