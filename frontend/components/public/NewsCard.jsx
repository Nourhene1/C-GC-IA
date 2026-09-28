import Link from "next/link";
import { useTranslations, useFormatter, useLocale } from "next-intl";
import { ArrowRight } from "lucide-react";
import { pick } from "@/lib/content";

export const CATEGORY_STYLES = {
  lancement: "bg-accent-light text-accent",
  rappel: "bg-amber-100 text-amber-800",
  resultats: "bg-green-100 text-green-800",
  general: "bg-blue-100 text-blue-800",
};

// Carte d'une actualité (liste publique, accueil, tableau de bord)
export default function NewsCard({ news }) {
  const t = useTranslations("news");
  const format = useFormatter();
  const locale = useLocale();
  const content = pick(news.content, locale);

  return (
    <Link href={`/news/${news._id}`}
      className="group flex flex-col rounded-2xl bg-white p-6 shadow-lg shadow-primary/5 transition hover:-translate-y-0.5 hover:shadow-xl">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className={`rounded-full px-2.5 py-1 font-bold ${CATEGORY_STYLES[news.category]}`}>
          {t(`categories.${news.category}`)}
        </span>
        <time dateTime={news.publishAt} className="text-slate-500">
          {format.dateTime(new Date(news.publishAt), { dateStyle: "long" })}
        </time>
      </div>
      <h3 className="mt-3 text-lg font-bold text-primary group-hover:text-accent">{pick(news.title, locale)}</h3>
      <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-slate-600">{content}</p>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-accent">
        {t("readMore")} <ArrowRight className="size-4 transition group-hover:translate-x-1" />
      </span>
    </Link>
  );
}
