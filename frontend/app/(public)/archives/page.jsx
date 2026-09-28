import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { Trophy, ImageOff, ArrowRight } from "lucide-react";
import PageHero from "@/components/public/PageHero";
import { serverApi, publicFileUrl } from "@/lib/server-api";
import { pick } from "@/lib/content";

// F1.1 : historique des sessions précédentes
export default async function ArchivesPage() {
  const t = await getTranslations("archives");
  const locale = await getLocale();
  const data = await serverApi("/api/editions/archives");
  const editions = data?.editions || [];

  return (
    <>
      <PageHero title={t("title")} subtitle={t("subtitle")} />

      <div className="mx-auto max-w-6xl px-4 py-10">
        {editions.length === 0 ? (
          <p className="rounded-2xl bg-white p-10 text-center text-slate-500">{t("empty")}</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {editions.map((e) => {
              const winner = [...(e.winners || [])].sort((a, b) => a.rank - b.rank)[0];
              return (
                <Link key={e._id} href={`/archives/${e.year}`}
                  className="group overflow-hidden rounded-2xl bg-white shadow-lg shadow-primary/5 transition hover:-translate-y-0.5 hover:shadow-xl">
                  <div className="relative aspect-[4/3] bg-primary">
                    {e.poster ? (
                      // eslint-disable-next-line @next/next/no-img-element -- image servie par l'API
                      <img src={publicFileUrl(e.poster)} alt={t("posterAlt", { year: e.year })}
                        className="size-full object-cover" />
                    ) : (
                      <div className="flex size-full items-center justify-center text-white/30">
                        <ImageOff className="size-12" />
                      </div>
                    )}
                    <span className="absolute left-4 top-4 rounded-full bg-accent px-3 py-1 text-sm font-extrabold text-white">
                      {e.year}
                    </span>
                  </div>
                  <div className="p-5">
                    <h2 className="font-bold text-primary group-hover:text-accent">{pick(e.theme, locale)}</h2>
                    {winner && (
                      <p className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                        <Trophy className="size-4 text-amber-500" /> {winner.teamName}
                      </p>
                    )}
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-accent">
                      {t("see")} <ArrowRight className="size-4" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
