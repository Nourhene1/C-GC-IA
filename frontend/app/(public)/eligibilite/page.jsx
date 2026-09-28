import { getLocale, getTranslations } from "next-intl/server";
import { BadgeCheck, Trophy, Medal, Users } from "lucide-react";
import PageHero from "@/components/public/PageHero";
import RichText from "@/components/public/RichText";
import { serverApi } from "@/lib/server-api";
import { pick } from "@/lib/content";

export async function generateMetadata() {
  const t = await getTranslations("eligibility");
  return { title: t("title") };
}

const PRIZE_STYLES = [
  "bg-accent text-white",            // 1er
  "bg-primary text-white",           // 2e
  "bg-white text-primary ring-2 ring-primary/15", // 3e et suivants
];

// F3.5 : critères d'éligibilité, prix et récompenses
export default async function EligibilityPage() {
  const t = await getTranslations("eligibility");
  const locale = await getLocale();
  const data = await serverApi("/api/content");
  const content = data?.content || {};
  const eligibility = pick(content.eligibility, locale);
  const prizes = [...(content.prizes || [])].sort((a, b) => a.rank - b.rank);
  const teamSize = data?.edition?.teamSize;

  return (
    <>
      <PageHero title={t("title")} subtitle={t("subtitle")} />
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10">
        <section className="rounded-3xl bg-white p-6 shadow-lg shadow-primary/5 sm:p-10">
          <h2 className="flex items-center gap-2 text-2xl font-extrabold text-primary">
            <BadgeCheck className="size-7 text-accent" /> {t("criteria")}
          </h2>
          {teamSize && (
            <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent-light px-4 py-2 text-sm font-semibold text-ink">
              <Users className="size-4 text-accent" /> {t("teamSize", { min: teamSize.min, max: teamSize.max })}
            </p>
          )}
          <div className="mt-6">
            {eligibility ? <RichText text={eligibility} /> : <p className="text-slate-500">{t("empty")}</p>}
          </div>
        </section>

        {prizes.length > 0 && (
          <section>
            <h2 className="flex items-center gap-2 text-2xl font-extrabold text-primary">
              <Trophy className="size-7 text-accent" /> {t("prizes")}
            </h2>
            <div className="mt-6 grid gap-5 md:grid-cols-3">
              {prizes.map((p, i) => (
                <div key={p._id || i} className={`flex flex-col gap-3 rounded-3xl p-6 shadow-lg shadow-primary/5 ${PRIZE_STYLES[Math.min(i, 2)]}`}>
                  {i === 0 ? <Trophy className="size-9" /> : <Medal className="size-9" />}
                  <p className="text-xl font-extrabold">{pick(p.title, locale)}</p>
                  <p className="whitespace-pre-line text-sm opacity-90">{pick(p.reward, locale)}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
