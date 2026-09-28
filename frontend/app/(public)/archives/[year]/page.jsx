import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowLeft, FileText, Trophy, Users, UserRound, School, Handshake } from "lucide-react";
import Podium from "@/components/public/Podium";
import SponsorGrid from "@/components/public/SponsorGrid";
import { serverApi, publicFileUrl } from "@/lib/server-api";
import { pick } from "@/lib/content";

export async function generateMetadata({ params }) {
  const { year } = await params;
  const t = await getTranslations("archives");
  return { title: t("editionTitle", { year }) };
}

// Détail d'une édition passée : affiche, sujet, gagnants, chiffres, sponsors
export default async function ArchiveDetailPage({ params }) {
  const { year } = await params;
  const t = await getTranslations("archives");
  const th = await getTranslations("home");
  const locale = await getLocale();

  const data = await serverApi(`/api/editions/${year}`);
  if (!data) notFound();
  const { edition, sponsors } = data;
  const summary = pick(edition.subjectSummary, locale);

  return (
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
            <h1 className="mt-4 text-3xl font-extrabold text-primary">{pick(edition.title, locale)}</h1>
            <p className="mt-2 text-lg text-slate-600">{pick(edition.theme, locale)}</p>
          </div>

          {summary && (
            <section className="rounded-2xl bg-white p-6 shadow-lg shadow-primary/5">
              <h2 className="flex items-center gap-2 font-bold text-primary">
                <FileText className="size-5 text-accent" /> {t("subject")}
              </h2>
              <p className="mt-3 whitespace-pre-line leading-relaxed text-ink">{summary}</p>
            </section>
          )}

          {edition.winners?.length > 0 && (
            <section className="rounded-2xl bg-white p-6 shadow-lg shadow-primary/5">
              <h2 className="mb-4 flex items-center gap-2 font-bold text-primary">
                <Trophy className="size-5 text-accent" /> {t("winners")}
              </h2>
              <Podium winners={edition.winners} />
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
                  <dd className="mt-1 text-2xl font-extrabold">{value}</dd>
                  <dt className="text-xs text-white/75">{label}</dt>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>

      {sponsors.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-6 flex items-center gap-2 text-2xl font-extrabold text-primary">
            <Handshake className="size-6 text-accent" /> {t("sponsors")}
          </h2>
          <SponsorGrid sponsors={sponsors} />
        </section>
      )}
    </div>
  );
}
