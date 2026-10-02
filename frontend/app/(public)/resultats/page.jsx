import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { CalendarClock, ListOrdered, Trophy } from "lucide-react";
import PageHero from "@/components/public/PageHero";
import ResultsPodium from "@/components/results/ResultsPodium";
import RankingTable from "@/components/results/RankingTable";
import { publicFileUrl } from "@/lib/server-api";
import { pick } from "@/lib/content";

export async function generateMetadata() {
  const t = await getTranslations("results");
  return { title: t("title") };
}

// On lit aussi la réponse 404 : elle contient la date de publication programmée
async function loadResults() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/results`, { cache: "no-store" });
    return { ok: res.ok, data: await res.json() };
  } catch {
    return { ok: false, data: {} };
  }
}

// F7.5 : page publique « Résultats » (podium + classement complet)
export default async function ResultsPage() {
  const t = await getTranslations("results");
  const locale = await getLocale();
  const format = await getFormatter();
  const { ok, data } = await loadResults();
  const date = (d) => format.dateTime(new Date(d), { dateStyle: "long", timeStyle: "short" });

  if (!ok) {
    return (
      <>
        <PageHero title={t("title")} subtitle={t("subtitle")} />
        <div className="mx-auto max-w-3xl px-4 py-14">
          <div className="rounded-3xl bg-white p-10 text-center shadow-lg shadow-primary/5">
            <CalendarClock className="mx-auto size-12 text-accent" />
            <h2 className="mt-4 text-xl font-bold text-primary">{t("notYetTitle")}</h2>
            <p className="mt-2 text-slate-600">
              {data.publishAt ? t("scheduledFor", { date: date(data.publishAt) }) : t("notYetText")}
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHero
        title={t("title")}
        subtitle={t("officialSubtitle", { edition: pick(data.edition.title, locale), date: date(data.publishedAt) })}
      />
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-12">
        <section>
          <h2 className="mb-8 flex items-center justify-center gap-2 text-2xl font-extrabold text-primary">
            <Trophy className="size-6 text-accent" /> {t("podium")}
          </h2>
          <ResultsPodium rows={data.rows} podiumSize={data.podiumSize} showScores={data.showScores}
            scale={data.scale} fileUrl={publicFileUrl} />
        </section>

        <section>
          <h2 className="mb-4 flex items-center gap-2 text-xl font-extrabold text-primary">
            <ListOrdered className="size-5 text-accent" /> {t("fullRanking")}
          </h2>
          <RankingTable rows={data.rows} scale={data.scale} showScores={data.showScores} />
        </section>
      </div>
    </>
  );
}
