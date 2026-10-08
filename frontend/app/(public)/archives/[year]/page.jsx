import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowLeft, FileText, Users, UserRound, School, Handshake, ListOrdered } from "lucide-react";
import PageHero from "@/components/public/PageHero";
import NewsVideo from "@/components/public/NewsVideo";
import EditionPodium from "@/components/public/EditionPodium";
import WinnerVideos from "@/components/public/WinnerVideos";
import EditionTestimonials from "@/components/public/EditionTestimonials";
import SponsorGrid from "@/components/public/SponsorGrid";
import RankingTable from "@/components/results/RankingTable";
import { serverApi, publicFileUrl } from "@/lib/server-api";
import { pick } from "@/lib/content";

export async function generateMetadata({ params }) {
  const { year } = await params;
  const t = await getTranslations("archives");
  return { title: t("editionTitle", { year }) };
}

// Détail d'une édition passée : bandeau, affiche, sujet, vidéo, podium, vidéos des équipes, témoignages, classement, sponsors
export default async function ArchiveDetailPage({ params }) {
  const { year } = await params;
  const t = await getTranslations("archives");
  const th = await getTranslations("home");
  const locale = await getLocale();

  const data = await serverApi(`/api/editions/${year}`);
  if (!data) notFound();
  const results = await serverApi(`/api/results?year=${year}`); // F7.8 : classement officiel archivé
  const { edition, sponsors = [] } = data;
  const summary = pick(edition.subjectSummary, locale);

  return (
    <>
      <PageHero title={pick(edition.title, locale)} subtitle={pick(edition.theme, locale)} />

      <div className="mx-auto max-w-6xl px-4 py-10">
        <Link href="/archives" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-accent">
          <ArrowLeft className="size-4" /> {t("back")}
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_2fr]">
          {edition.poster && (
            // eslint-disable-next-line @next/next/no-img-element -- image servie par l'API
            <img src={publicFileUrl(edition.poster)} alt={t("posterAlt", { year: edition.year })}
              className="w-full rounded-3xl shadow-xl shadow-primary/10" />
          )}

          <div className={`flex flex-col gap-6 ${edition.poster ? "" : "lg:col-span-2"}`}>
            <div>
              <span className="rounded-full bg-accent px-3 py-1 text-sm font-extrabold text-white">{edition.year}</span>
            </div>

            {summary && (
              <section className="rounded-2xl bg-white p-6 shadow-lg shadow-primary/5">
                <h2 className="flex items-center gap-2 font-bold text-primary">
                  <FileText className="size-5 text-accent" /> {t("subject")}
                </h2>
                <p className="mt-3 whitespace-pre-line leading-relaxed text-ink">{summary}</p>
              </section>
            )}

            {edition.stats?.teams > 0 && (
              <dl className="grid grid-cols-3 gap-3 text-center">
                {[
                  { Icon: Users, value: edition.stats.teams, label: th("statsTeams") },
                  { Icon: UserRound, value: edition.stats.participants, label: th("statsParticipants") },
                  { Icon: School, value: edition.stats.schools, label: th("statsSchools") },
                ].map(({ Icon, value, label }) => (
                  <div key={label} className="rounded-2xl bg-primary p-4 text-white">
                    <Icon className="mx-auto size-6 text-accent" />
                    <dt className="text-xs text-white/75">{label}</dt>
                    <dd className="mt-1 text-2xl font-extrabold">{value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </div>

        {/* Vidéo générale de l'édition */}
        {edition.video?.provider && (
          <section className="mt-12">
            <NewsVideo video={edition.video} />
          </section>
        )}

        {/* Podium des trois premières équipes */}
        {edition.winners?.length > 0 && (
          <section className="mt-12">
            <EditionPodium winners={edition.winners} />
          </section>
        )}

        {/* Vidéos de présentation des équipes gagnantes */}
        {edition.winners?.some((w) => w.video?.provider) && (
          <section className="mt-12">
            <WinnerVideos winners={edition.winners} />
          </section>
        )}

        {/* Témoignages des anciens participants */}
        {edition.testimonials?.length > 0 && (
          <section className="mt-12">
            <EditionTestimonials testimonials={edition.testimonials} />
          </section>
        )}

        {/* Classement officiel archivé */}
        {results?.rows?.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-6 flex items-center gap-2 text-2xl font-extrabold text-primary">
              <ListOrdered className="size-6 text-accent" /> {t("fullRanking")}
            </h2>
            <RankingTable rows={results.rows} scale={results.scale} showScores={results.showScores} />
          </section>
        )}

        {sponsors.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-6 flex items-center gap-2 text-2xl font-extrabold text-primary">
              <Handshake className="size-6 text-accent" /> {t("sponsors")}
            </h2>
            <SponsorGrid sponsors={sponsors} />
          </section>
        )}
      </div>
    </>
  );
}