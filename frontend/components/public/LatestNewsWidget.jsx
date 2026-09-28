"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations, useFormatter } from "next-intl";
import { Megaphone, ArrowRight } from "lucide-react";
import { card, sectionTitle } from "@/components/ui/styles";
import { api } from "@/lib/api";
import { pick } from "@/lib/content";

const NEW_DAYS = 7; // une annonce est "nouvelle" pendant 7 jours

// F1.4 : les dernières annonces dans le tableau de bord des équipes
export default function LatestNewsWidget() {
  const t = useTranslations("news");
  const locale = useLocale();
  const format = useFormatter();
  const [news, setNews] = useState(null);

  useEffect(() => {
    api("/api/news?limit=3").then((d) => setNews(d.news)).catch(() => setNews([]));
  }, []);

  if (!news || news.length === 0) return null;

  const isNew = (date) => Date.now() - new Date(date).getTime() < NEW_DAYS * 86_400_000;

  return (
    <section className={card}>
      <div className="flex items-center justify-between gap-3">
        <h2 className={sectionTitle}><Megaphone className="size-5 text-accent" /> {t("announcements")}</h2>
        <Link href="/news" className="inline-flex items-center gap-1 text-sm font-semibold text-accent hover:underline">
          {t("all")} <ArrowRight className="size-4" />
        </Link>
      </div>
      <ul className="mt-4 divide-y divide-slate-100">
        {news.map((n) => (
          <li key={n._id}>
            <Link href={`/news/${n._id}`} className="group flex items-start gap-3 py-3">
              <span className={`mt-1.5 size-2 shrink-0 rounded-full ${isNew(n.publishAt) ? "bg-accent" : "bg-slate-200"}`} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink group-hover:text-accent">
                  {pick(n.title, locale)}
                  {isNew(n.publishAt) && (
                    <span className="ml-2 rounded-full bg-accent-light px-2 py-0.5 text-[11px] font-bold text-accent">{t("new")}</span>
                  )}
                </p>
                <time className="text-xs text-slate-500">{format.dateTime(new Date(n.publishAt), { dateStyle: "long" })}</time>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
