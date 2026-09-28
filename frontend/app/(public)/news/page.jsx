import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ChevronLeft, ChevronRight } from "lucide-react";
import PageHero from "@/components/public/PageHero";
import NewsCard from "@/components/public/NewsCard";
import { serverApi } from "@/lib/server-api";

const CATEGORIES = ["lancement", "rappel", "resultats", "general"];

// F1.2 : liste des actualités, filtrable par catégorie, avec pagination
export default async function NewsPage({ searchParams }) {
  const t = await getTranslations("news");
  const { category = "", page = "1" } = await searchParams;

  const query = new URLSearchParams({ limit: "9", page, ...(category && { category }) });
  const data = await serverApi(`/api/news?${query}`);
  const news = data?.news || [];

  // Construit un lien en gardant les autres filtres
  const href = (params) => {
    const q = new URLSearchParams({ ...(category && { category }), page, ...params });
    if (!q.get("category")) q.delete("category");
    if (q.get("page") === "1") q.delete("page");
    const s = q.toString();
    return s ? `/news?${s}` : "/news";
  };

  const current = Number(page);

  return (
    <>
      <PageHero title={t("title")} subtitle={t("subtitle")} />

      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-wrap gap-2">
          {["", ...CATEGORIES].map((c) => (
            <Link key={c || "all"} href={href({ category: c, page: "1" })}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                category === c ? "bg-primary text-white" : "bg-white text-primary hover:bg-accent-light"
              }`}>
              {c ? t(`categories.${c}`) : t("all")}
            </Link>
          ))}
        </div>

        {news.length === 0 ? (
          <p className="mt-10 rounded-2xl bg-white p-10 text-center text-slate-500">{t("empty")}</p>
        ) : (
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {news.map((n) => <NewsCard key={n._id} news={n} />)}
          </div>
        )}

        {data && data.pages > 1 && (
          <nav className="mt-10 flex items-center justify-center gap-4" aria-label={t("pagination")}>
            {current > 1 ? (
              <Link href={href({ page: String(current - 1) })} className="rounded-lg p-2 text-primary hover:bg-white" aria-label={t("previous")}>
                <ChevronLeft className="size-5" />
              </Link>
            ) : <span className="size-9" />}
            <span className="text-sm font-semibold text-primary">{t("page", { page: current, pages: data.pages })}</span>
            {current < data.pages ? (
              <Link href={href({ page: String(current + 1) })} className="rounded-lg p-2 text-primary hover:bg-white" aria-label={t("next")}>
                <ChevronRight className="size-5" />
              </Link>
            ) : <span className="size-9" />}
          </nav>
        )}
      </div>
    </>
  );
}
