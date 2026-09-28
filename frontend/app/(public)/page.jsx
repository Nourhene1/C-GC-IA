import Image from "next/image";
import Link from "next/link";
import { getLocale, getTranslations, getFormatter } from "next-intl/server";
import { ArrowRight, CalendarDays, Users, UserRound, School, CircleCheck } from "lucide-react";
import Countdown from "@/components/public/Countdown";
import NewsCard from "@/components/public/NewsCard";
import SponsorGrid from "@/components/public/SponsorGrid";
import { serverApi } from "@/lib/server-api";
import { pick, MILESTONES } from "@/lib/content";

// F1.1 : page d'accueil de l'édition en cours
export default async function HomePage() {
  const t = await getTranslations("home");
  const tc = await getTranslations("common");
  const tcd = await getTranslations("countdown");
  const locale = await getLocale();
  const format = await getFormatter();

  // Les trois appels partent en même temps
  const [current, newsData, sponsorsData] = await Promise.all([
    serverApi("/api/editions/current"),
    serverApi("/api/news?limit=3"),
    serverApi("/api/sponsors"),
  ]);

  const edition = current?.edition;
  const now = current ? new Date(current.now) : new Date();
  const registrationOpen =
    edition && now >= new Date(edition.dates.registrationOpen) && now <= new Date(edition.dates.registrationClose);
  const news = newsData?.news || [];
  const sponsors = sponsorsData?.sponsors || [];

  return (
    <>
      {/* ---------- Bandeau principal ---------- */}
      <section className="relative overflow-hidden bg-primary text-white">
        <span aria-hidden className="absolute -left-20 top-10 h-5 w-96 -rotate-12 bg-accent" />
        <span aria-hidden className="absolute -left-16 top-20 h-2 w-80 -rotate-12 bg-white/15" />
        <span aria-hidden className="absolute -bottom-6 -right-20 h-5 w-96 -rotate-12 bg-accent" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pb-28 pt-16 md:grid-cols-[1fr_auto]">
          <div>
            {edition && (
              <span className="inline-block rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold ring-1 ring-white/20">
                {t("edition", { year: edition.year })}
              </span>
            )}
            <h1 className="mt-5 text-4xl font-extrabold uppercase leading-tight sm:text-5xl">
              {tc("competition")}
              <span className="block text-accent">IA &amp; {t("civilEngineering")}</span>
            </h1>
            <p className="mt-4 max-w-xl text-lg text-white/85">
              {edition ? pick(edition.theme, locale) : tc("tagline")}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {registrationOpen && (
                <Link href="/register"
                  className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3.5 font-semibold text-white shadow-lg shadow-black/20 transition hover:bg-white hover:text-primary">
                  {t("cta")} <ArrowRight className="size-5" />
                </Link>
              )}
              <a href="#dates"
                className="inline-flex items-center gap-2 rounded-xl px-6 py-3.5 font-semibold text-white ring-1 ring-white/30 transition hover:bg-white/10">
                <CalendarDays className="size-5" /> {t("keyDates")}
              </a>
            </div>
          </div>

          <div className="mx-auto rounded-full bg-white p-2 shadow-2xl shadow-black/30 ring-8 ring-white/10">
            <Image src="/logo.png" alt={tc("logoAlt")} width={280} height={280} priority className="rounded-full" />
          </div>
        </div>
      </section>

      {/* ---------- Compte à rebours (F1.3) ---------- */}
      {edition && (
        <section className="relative mx-auto -mt-16 max-w-3xl px-4">
          <div className="rounded-3xl bg-white p-6 shadow-2xl shadow-primary/10 sm:p-8">
            <Countdown dates={edition.dates} serverNow={current.now} />
          </div>
        </section>
      )}

      {!edition && (
        <p className="mx-auto mt-10 max-w-3xl px-4 text-center text-slate-500">{t("unavailable")}</p>
      )}

      {/* ---------- Dates clés ---------- */}
      {edition && (
        <section id="dates" className="mx-auto mt-16 max-w-6xl scroll-mt-24 px-4">
          <h2 className="text-center text-2xl font-extrabold text-primary sm:text-3xl">{t("keyDates")}</h2>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {MILESTONES.map((key, i) => {
              const date = new Date(edition.dates[key]);
              const past = date <= now;
              return (
                <li key={key}
                  className={`relative rounded-2xl p-5 ${past ? "bg-white/60 text-slate-500" : "bg-white shadow-lg shadow-primary/5"}`}>
                  <span className={`flex size-9 items-center justify-center rounded-full text-sm font-extrabold ${
                    past ? "bg-slate-200 text-slate-500" : "bg-accent text-white"}`}>
                    {past ? <CircleCheck className="size-5" /> : i + 1}
                  </span>
                  <p className={`mt-3 font-bold ${past ? "" : "text-primary"}`}>{tcd(`label.${key}`)}</p>
                  <p className="mt-1 text-sm">{format.dateTime(date, { dateStyle: "long", timeStyle: "short" })}</p>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {/* ---------- Chiffres de l'édition précédente ---------- */}
      {edition?.stats?.teams > 0 && (
        <section className="mx-auto mt-16 max-w-6xl px-4">
          <div className="rounded-3xl bg-primary px-6 py-10 text-white">
            <h2 className="text-center text-xl font-bold">{t("statsTitle")}</h2>
            <dl className="mt-8 grid gap-6 text-center sm:grid-cols-3">
              {[
                { Icon: Users, value: edition.stats.teams, label: t("statsTeams") },
                { Icon: UserRound, value: edition.stats.participants, label: t("statsParticipants") },
                { Icon: School, value: edition.stats.schools, label: t("statsSchools") },
              ].map(({ Icon, value, label }) => (
                <div key={label}>
                  <Icon className="mx-auto size-8 text-accent" />
                  <dd className="mt-2 text-4xl font-extrabold">{value}</dd>
                  <dt className="mt-1 text-sm text-white/75">{label}</dt>
                </div>
              ))}
            </dl>
          </div>
        </section>
      )}

      {/* ---------- Dernières actualités (F1.2) ---------- */}
      {news.length > 0 && (
        <section className="mx-auto mt-16 max-w-6xl px-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-2xl font-extrabold text-primary sm:text-3xl">{t("latestNews")}</h2>
            <Link href="/news" className="inline-flex items-center gap-1 font-semibold text-accent hover:underline">
              {t("allNews")} <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {news.map((n) => <NewsCard key={n._id} news={n} />)}
          </div>
        </section>
      )}

      {/* ---------- Partenaires (F1.5) ---------- */}
      {sponsors.length > 0 && (
        <section className="mx-auto mt-16 max-w-6xl px-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-2xl font-extrabold text-primary sm:text-3xl">{t("partners")}</h2>
            <Link href="/partenaires" className="inline-flex items-center gap-1 font-semibold text-accent hover:underline">
              {t("allPartners")} <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="mt-6">
            <SponsorGrid sponsors={sponsors} grouped={false} />
          </div>
        </section>
      )}
    </>
  );
}
