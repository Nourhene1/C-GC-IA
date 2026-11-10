import Image from "next/image";
import Link from "next/link";
import { getLocale, getTranslations, getFormatter } from "next-intl/server";
import {
  ArrowRight,
  CalendarDays,
  Users,
  UserRound,
  School,
  CircleCheck,
  Trophy,
  ImageOff,
} from "lucide-react";
import Countdown from "@/components/public/Countdown";
import PosterLightbox from "@/components/public/PosterLightbox";
import NewsCard from "@/components/public/NewsCard";
import SponsorGrid from "@/components/public/SponsorGrid";
import { serverApi, publicFileUrl } from "@/lib/server-api";
import { assetUrl } from "@/lib/eventSponsorsApi";
import { pick, MILESTONES } from "@/lib/content";

// Page d'accueil de l'édition en cours
export default async function HomePage() {
  const t = await getTranslations("home");
  const tc = await getTranslations("common");
  const tn = await getTranslations("nav");
  const tcd = await getTranslations("countdown");
  const to = await getTranslations("organization");
  const locale = await getLocale();
  const format = await getFormatter();

  // Les appels partent en même temps
  const [
    current,
    newsData,
    sponsorsData,
    eventSponsorsData,
    contentData,
    archivesData,
    organizationData,
  ] = await Promise.all([
    serverApi("/api/editions/current"),
    serverApi("/api/news?limit=3"),
    serverApi("/api/sponsors"),
    serverApi("/api/event-sponsors"),
    serverApi("/api/content"),
    serverApi("/api/editions/archives"),
    serverApi("/api/organization"),
  ]);

  const edition = current?.edition;
  const now = current ? new Date(current.now) : new Date();

  const registrationOpen =
    edition &&
    now >= new Date(edition.dates.registrationOpen) &&
    now <= new Date(edition.dates.registrationClose);

  // Affiche de l'édition en cours (servie via le proxy /files)
  const posterUrl = edition?.poster ? publicFileUrl(edition.poster) : null;

  const news = newsData?.news || [];
  const sponsors = sponsorsData?.sponsors || [];

  // /api/event-sponsors renvoie directement un tableau
  const eventSponsors = Array.isArray(eventSponsorsData)
    ? eventSponsorsData
    : [];

  // Jury
  const jury = contentData?.content?.jury || [];

  // Membres du comité d'organisation
  const organizationMembers = organizationData?.members || [];

  // Archives
  const archivesList = Array.isArray(archivesData)
    ? archivesData
    : archivesData?.editions || [];

  const archives = archivesList.filter((e) => !e.isCurrent).slice(0, 3);

  return (
    <>
      {/* ---------- Bandeau principal ---------- */}
      <section className="group relative overflow-hidden bg-gradient-to-br from-primary via-primary to-slate-900 text-white [clip-path:polygon(0_0,100%_0,100%_93%,0_100%)]">
        {/* Trame plan d'ingénieur */}
        <span
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.10)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.10)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(ellipse_at_30%_40%,#000,transparent_70%)]"
        />

        {/* Grand panneau orange incliné derrière le logo */}
        <span
          aria-hidden
          className="absolute -right-32 inset-y-0 hidden w-[46%] skew-x-[-10deg] bg-accent transition-transform duration-700 group-hover:translate-x-3 md:block"
        />

        <span
          aria-hidden
          className="absolute inset-y-0 right-[44%] hidden w-5 skew-x-[-10deg] bg-white/15 transition-transform duration-700 group-hover:-translate-x-2 md:block"
        />

        {/* Halo qui pulse derrière le logo */}
        <span
          aria-hidden
          className="absolute right-[6%] top-1/2 hidden size-[30rem] -translate-y-1/2 rounded-full bg-white/20 blur-3xl motion-safe:animate-[pulse_5s_ease-in-out_infinite] md:block"
        />

        {/* Petites pièces animées */}
        <span
          aria-hidden
          className="absolute left-[46%] top-16 hidden size-4 rotate-45 bg-accent motion-safe:animate-bounce md:block"
        />
        <span
          aria-hidden
          className="absolute left-[52%] bottom-32 hidden size-3 rounded-full bg-white/60 motion-safe:animate-[bounce_2.6s_infinite] [animation-delay:.6s] md:block"
        />
        <span
          aria-hidden
          className="absolute left-[42%] bottom-40 hidden size-2.5 bg-white/40 motion-safe:animate-ping md:block"
        />

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-36 pt-14 md:grid-cols-[1fr_auto] md:pb-40 md:pt-16">
          {/* Colonne texte */}
          <div className="min-w-0">
            <div className="flex min-h-20 flex-wrap items-center gap-4">
              <Image
                src="/logo_iset.png"
                alt="ISET Sfax"
                width={200}
                height={200}
                className="h-auto w-16 shrink-0 rounded-2xl bg-white p-1.5 shadow-xl shadow-black/30 sm:w-20 min-[1440px]:hidden"
              />

              {edition && (
                <>
                  <span
                    aria-hidden
                    className="h-10 w-px bg-white/30 min-[1440px]:hidden"
                  />

                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold ring-1 ring-white/25 backdrop-blur">
                    {registrationOpen && (
                      <span className="relative flex size-2.5">
                        <span className="absolute inline-flex size-full rounded-full bg-accent motion-safe:animate-ping" />
                        <span className="relative inline-flex size-2.5 rounded-full bg-accent" />
                      </span>
                    )}

                    {t("edition", { year: edition.year })}
                  </span>
                </>
              )}
            </div>

            {/* Titre */}
            <div className="relative mt-8 border-l-8 border-accent pl-5">
              <Image
                src="/logo_iset.png"
                alt="ISET Sfax"
                width={400}
                height={400}
                className="absolute right-full top-1/2 mr-5 hidden h-auto w-28 -translate-y-1/2 rounded-2xl bg-white p-2 shadow-xl shadow-black/30 transition-transform duration-300 hover:-rotate-3 hover:scale-105 min-[1440px]:block min-[1520px]:mr-6 min-[1520px]:w-40"
              />

              <h1 className="text-4xl font-black uppercase leading-[1.05] sm:text-5xl xl:text-6xl">
                {tc("competition")}
                <span className="mt-1 block text-accent">
                  IA &amp; {t("civilEngineering")}
                </span>
              </h1>
            </div>

            {/* Thème de l'édition */}
            <p className="mt-6 max-w-xl text-lg text-white/85">
              {edition ? pick(edition.theme, locale) : tc("tagline")}
            </p>

            {/* Boutons */}
            <div className="mt-9 flex flex-wrap gap-4">
              {registrationOpen && (
                <Link
                  href="/register"
                  className="group/btn inline-flex items-center gap-3 rounded-full bg-accent py-3.5 pl-7 pr-3.5 font-bold text-white shadow-xl shadow-black/30 transition hover:-translate-y-1 hover:bg-white hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  {t("cta")}

                  <span className="flex size-9 items-center justify-center rounded-full bg-white/25 transition group-hover/btn:bg-primary group-hover/btn:text-white">
                    <ArrowRight className="size-5 transition-transform group-hover/btn:translate-x-0.5" />
                  </span>
                </Link>
              )}

              <a
                href="#dates"
                className="group/btn inline-flex items-center gap-2 rounded-full px-7 py-3.5 font-bold text-white ring-2 ring-white/40 backdrop-blur transition hover:-translate-y-1 hover:bg-white/10 hover:ring-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <CalendarDays className="size-5 transition-transform group-hover/btn:-rotate-12 group-hover/btn:scale-110" />
                {t("keyDates")}
              </a>
            </div>
          </div>

          {/* Logo de la compétition */}
          <div className="relative mx-auto">
            <span
              aria-hidden
              className="absolute -inset-8 rounded-full border-2 border-dashed border-white/50 motion-safe:animate-[spin_45s_linear_infinite]"
            />

            <span
              aria-hidden
              className="absolute -inset-4 rounded-full border-[5px] border-transparent border-t-white motion-safe:animate-[spin_8s_linear_infinite_reverse]"
            />

            <div className="relative rounded-full bg-white p-2 shadow-2xl shadow-black/50 ring-8 ring-white/20 transition-transform duration-500 hover:scale-105 hover:rotate-3">
              <Image
                src="/logo.png"
                alt={tc("logoAlt")}
                width={300}
                height={300}
                priority
                className="h-auto w-56 rounded-full sm:w-72"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Compte à rebours ---------- */}
      {edition && (
        <section className="relative mx-auto -mt-20 max-w-3xl px-4">
          <div className="rounded-3xl bg-white p-6 shadow-2xl shadow-primary/10 sm:p-8">
            <Countdown dates={edition.dates} serverNow={current.now} />
          </div>
        </section>
      )}

      {!edition && (
        <p className="mx-auto mt-10 max-w-3xl px-4 text-center text-slate-500">
          {t("unavailable")}
        </p>
      )}

      {/* ---------- Affiche de l'édition en cours ---------- */}
      {posterUrl && (
        <section className="mx-auto mt-20 max-w-6xl px-4">
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary to-slate-900 px-6 py-14 text-white sm:px-12">
            {/* Trame de fond */}
            <span
              aria-hidden
              className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] bg-[size:36px_36px] [mask-image:radial-gradient(ellipse_at_25%_50%,#000,transparent_70%)]"
            />

            {/* Petite pièce décorative */}
            <span
              aria-hidden
              className="absolute right-10 top-10 hidden size-4 rotate-45 bg-accent motion-safe:animate-bounce md:block"
            />

            <div className="relative grid items-center gap-14 md:grid-cols-[auto_1fr]">
              {/* Affiche (s'ouvre en grand sans exposer l'URL) */}
              <PosterLightbox
                src={posterUrl}
                alt={t("posterAlt", { year: edition.year })}
                openLabel={t("posterOpen")}
              />

              {/* Texte */}
              <div className="text-center md:text-start">
                <span className="inline-block rounded-full bg-accent px-4 py-1 text-sm font-bold">
                  {t("edition", { year: edition.year })}
                </span>

                <h2 className="mt-4 text-3xl font-black uppercase leading-tight sm:text-4xl">
                  {t("posterTitle")}
                </h2>

                <p className="mx-auto mt-4 max-w-lg text-white/80 md:mx-0">
                  {pick(edition.theme, locale)}
                </p>

                {registrationOpen && (
                  <div className="mt-8 flex flex-wrap justify-center gap-4 md:justify-start">
                    <Link
                      href="/register"
                      className="group/btn inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 font-bold text-white transition hover:-translate-y-1 hover:bg-white hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    >
                      {t("cta")}
                      <ArrowRight className="size-5 transition-transform group-hover/btn:translate-x-0.5" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ---------- Dates clés ---------- */}
      {edition && (
        <section
          id="dates"
          className="mx-auto mt-16 max-w-6xl scroll-mt-24 px-4"
        >
          <h2 className="text-center text-2xl font-extrabold text-primary sm:text-3xl">
            {t("keyDates")}
          </h2>

          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {MILESTONES.map((key, i) => {
              const date = new Date(edition.dates[key]);
              const past = date <= now;

              return (
                <li
                  key={key}
                  className={`relative rounded-2xl p-5 ${
                    past
                      ? "bg-white/60 text-slate-500"
                      : "bg-white shadow-lg shadow-primary/5"
                  }`}
                >
                  <span
                    className={`flex size-9 items-center justify-center rounded-full text-sm font-extrabold ${
                      past
                        ? "bg-slate-200 text-slate-500"
                        : "bg-accent text-white"
                    }`}
                  >
                    {past ? <CircleCheck className="size-5" /> : i + 1}
                  </span>

                  <p className={`mt-3 font-bold ${past ? "" : "text-primary"}`}>
                    {tcd(`label.${key}`)}
                  </p>

                  <p className="mt-1 text-sm">
                    {format.dateTime(date, {
                      dateStyle: "long",
                      timeStyle: "short",
                    })}
                  </p>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {/* ---------- Jury ---------- */}
      {jury.length > 0 && (
        <section className="mx-auto mt-16 max-w-6xl px-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-2xl font-extrabold text-primary sm:text-3xl">
              {tn("jury")}
            </h2>

            <Link
              href="/jury"
              className="inline-flex items-center gap-1 font-semibold text-accent hover:underline"
            >
              {t("seeMore")} <ArrowRight className="size-4" />
            </Link>
          </div>

          <ul className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            {jury.slice(0, 4).map((m, i) => (
              <li
                key={m._id || i}
                className="flex flex-col items-center rounded-2xl bg-white p-5 text-center shadow-md shadow-primary/5"
              >
                <span className="flex size-20 items-center justify-center overflow-hidden rounded-full bg-accent-light">
                  {m.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={publicFileUrl(m.photo)}
                      alt={m.name}
                      className="size-full object-cover"
                    />
                  ) : (
                    <UserRound className="size-9 text-accent" />
                  )}
                </span>

                <p className="mt-3 font-bold text-primary">{m.name}</p>
                <p className="text-sm text-slate-500">{pick(m.role, locale)}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ---------- Comité d'organisation ---------- */}
      {organizationMembers.length > 0 && (
        <section className="mx-auto mt-16 max-w-6xl px-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-extrabold text-primary sm:text-3xl">
                {to("title")}
              </h2>

              <p className="mt-2 text-sm text-slate-500">{to("subtitle")}</p>
            </div>

            <Link
              href="/organisation"
              className="inline-flex items-center gap-1 font-semibold text-accent hover:underline"
            >
              {t("seeMore")} <ArrowRight className="size-4" />
            </Link>
          </div>

          <ul className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            {organizationMembers.slice(0, 4).map((m) => (
              <li
                key={m._id}
                className="flex flex-col items-center rounded-2xl bg-white p-5 text-center shadow-md shadow-primary/5 transition hover:-translate-y-1 hover:shadow-lg"
              >
                <span className="flex size-20 items-center justify-center overflow-hidden rounded-full bg-accent-light">
                  {m.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={publicFileUrl(m.photo)}
                      alt={`${m.firstName} ${m.lastName}`}
                      className="size-full object-cover"
                    />
                  ) : (
                    <UserRound className="size-9 text-accent" />
                  )}
                </span>

                <p className="mt-3 font-bold text-primary">
                  {m.firstName} {m.lastName}
                </p>

                <p className="mt-1 text-sm text-slate-500">{m.role}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ---------- Chiffres de l'édition précédente ---------- */}
      {edition?.stats?.teams > 0 && (
        <section className="mx-auto mt-16 max-w-6xl px-4">
          <div className="rounded-3xl bg-primary px-6 py-10 text-white">
            <h2 className="text-center text-xl font-bold">
              {t("statsTitle")}
            </h2>

            <dl className="mt-8 grid gap-6 text-center sm:grid-cols-3">
              {[
                {
                  Icon: Users,
                  value: edition.stats.teams,
                  label: t("statsTeams"),
                },
                {
                  Icon: UserRound,
                  value: edition.stats.participants,
                  label: t("statsParticipants"),
                },
                {
                  Icon: School,
                  value: edition.stats.schools,
                  label: t("statsSchools"),
                },
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

      {/* ---------- Dernières actualités ---------- */}
      {news.length > 0 && (
        <section className="mx-auto mt-16 max-w-6xl px-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-2xl font-extrabold text-primary sm:text-3xl">
              {t("latestNews")}
            </h2>

            <Link
              href="/news"
              className="inline-flex items-center gap-1 font-semibold text-accent hover:underline"
            >
              {t("allNews")} <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {news.map((n) => (
              <NewsCard key={n._id} news={n} />
            ))}
          </div>
        </section>
      )}

      {/* ---------- Archives ---------- */}
      {archives.length > 0 && (
        <section className="mx-auto mt-16 max-w-6xl px-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-2xl font-extrabold text-primary sm:text-3xl">
              {t("pastEditions")}
            </h2>

            <Link
              href="/archives"
              className="inline-flex items-center gap-1 font-semibold text-accent hover:underline"
            >
              {t("allEditions")} <ArrowRight className="size-4" />
            </Link>
          </div>

          <ul className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {archives.map((e) => {
              const winner = e.winners?.find((w) => w.rank === 1);

              return (
                <li key={e._id}>
                  <Link
                    href={`/archives/${e.year}`}
                    className="group flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-lg shadow-primary/5 transition hover:-translate-y-1 hover:shadow-xl"
                  >
                    <div className="relative flex h-56 items-center justify-center bg-primary">
                      {e.poster ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={publicFileUrl(e.poster)}
                          alt=""
                          className="size-full object-cover"
                        />
                      ) : (
                        <ImageOff className="size-10 text-white/40" />
                      )}

                      <span className="absolute left-4 top-4 rounded-full bg-accent px-3 py-1 text-sm font-extrabold text-white">
                        {e.year}
                      </span>
                    </div>

                    <div className="flex flex-1 flex-col gap-3 p-5">
                      <h3 className="text-lg font-bold leading-snug text-primary">
                        {pick(e.title, locale)}
                      </h3>

                      {winner && (
                        <p className="flex items-start gap-2 text-sm text-slate-600">
                          <Trophy className="mt-0.5 size-4 shrink-0 text-accent" />
                          {winner.teamName}
                        </p>
                      )}

                      <span className="mt-auto inline-flex items-center gap-1 font-semibold text-accent">
                        {t("see")}{" "}
                        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* ---------- Sponsors de l'événement ---------- */}
      {eventSponsors.length > 0 && (
        <section className="mx-auto mt-16 max-w-6xl px-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-2xl font-extrabold text-primary sm:text-3xl">
              {t("eventSponsors")}
            </h2>

            <Link
              href="/sponsors"
              className="inline-flex items-center gap-1 font-semibold text-accent hover:underline"
            >
              {t("allEventSponsors")} <ArrowRight className="size-4" />
            </Link>
          </div>

          <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {eventSponsors.slice(0, 6).map((s) => (
              <li
                key={s._id}
                className="flex h-24 items-center justify-center rounded-2xl bg-white p-4 shadow-md shadow-primary/5 transition hover:-translate-y-1 hover:shadow-lg"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={assetUrl(s.logo)}
                  alt={s.name}
                  title={s.name}
                  className="max-h-full max-w-full object-contain"
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ---------- Partenaires ---------- */}
      {sponsors.length > 0 && (
        <section className="mx-auto mt-16 max-w-6xl px-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-2xl font-extrabold text-primary sm:text-3xl">
              {t("partners")}
            </h2>

            <Link
              href="/partenaires"
              className="inline-flex items-center gap-1 font-semibold text-accent hover:underline"
            >
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