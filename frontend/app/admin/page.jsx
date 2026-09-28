"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations, useFormatter } from "next-intl";
import {
  ArrowRight, Clock, UserCog, FolderKanban, Megaphone, Handshake, CalendarRange,
  Plus, ExternalLink, CalendarCheck, CalendarX, Mail,
} from "lucide-react";
import RequireAuth from "@/components/auth/RequireAuth";
import AppShell from "@/components/layout/AppShell";
import Spinner from "@/components/ui/Spinner";
import { ErrorAlert } from "@/components/ui/Alert";
import { STATUS_STYLES } from "@/components/ui/StatusBadge";
import { btn, card, sectionTitle } from "@/components/ui/styles";
import { api } from "@/lib/api";
import { pick } from "@/lib/content";
import { DATE_LONG } from "@/lib/format";

const STATUS_ORDER = ["en_attente", "en_revision", "valide", "rejete", "brouillon"];
const ROLE_ORDER = ["chef", "membre", "jury", "admin"];

function AdminHome() {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const ts = useTranslations("status");
  const locale = useLocale();
  const format = useFormatter();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  // Toutes les données du tableau de bord en une fois
  useEffect(() => {
    Promise.all([
      api("/api/admin/stats"),
      api("/api/admin/news"),
      api("/api/sponsors"),
      api("/api/editions/current").catch(() => null), // pas d'édition en cours : on continue
      api("/api/admin/messages?unread=1"),
    ])
      .then(([stats, news, sponsors, current, messages]) => setData({ stats, news, sponsors, current, messages }))
      .catch(setError);
  }, []);

  if (error) return <ErrorAlert error={error} />;
  if (!data) return <Spinner />;

  const teams = Object.fromEntries(data.stats.teams.map((s) => [s._id, s.total]));
  const users = Object.fromEntries(data.stats.users.map((s) => [s._id, s.total]));
  const pending = teams.en_attente || 0;
  const newsCounts = data.news.counts;
  const edition = data.current?.edition;

  // État des inscriptions calculé avec l'heure du serveur
  const now = data.current ? new Date(data.current.now) : new Date();
  const regOpen = edition && now >= new Date(edition.dates.registrationOpen) && now <= new Date(edition.dates.registrationClose);
  const regNotYet = edition && now < new Date(edition.dates.registrationOpen);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-primary">{t("title")}</h1>
        <a href="/" target="_blank" rel="noopener noreferrer" className={btn.outline}>
          <ExternalLink className="size-4" /> {t("viewSite")}
        </a>
      </div>

      {/* ---- Édition en cours ---- */}
      {edition && (
        <section className={`${card} flex flex-col gap-4 sm:flex-row sm:items-center`}>
          <span className="w-fit rounded-xl bg-primary px-4 py-2 text-2xl font-extrabold text-white">{edition.year}</span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{t("currentEdition")}</p>
            <p className="font-bold text-primary">{pick(edition.theme, locale)}</p>
            <p className={`mt-1 inline-flex items-center gap-1.5 text-sm font-semibold ${regOpen ? "text-green-700" : "text-slate-500"}`}>
              {regOpen ? <CalendarCheck className="size-4" /> : <CalendarX className="size-4" />}
              {regOpen
                ? `${t("registrationOpen")} ${t("until", { date: format.dateTime(new Date(edition.dates.registrationClose), DATE_LONG) })}`
                : regNotYet
                  ? t("opensOn", { date: format.dateTime(new Date(edition.dates.registrationOpen), DATE_LONG) })
                  : t("registrationClosed")}
            </p>
          </div>
          <Link href={`/admin/editions/${edition._id}`} className={btn.outline}>{t("editEdition")}</Link>
        </section>
      )}

      {/* ---- Dossiers à examiner (F2.6) ---- */}
      <Link href="/admin/teams?status=en_attente"
        className="flex items-center gap-4 rounded-2xl bg-primary p-6 text-white shadow-lg transition hover:bg-primary-dark">
        <Clock className="size-8 text-accent" />
        <span className="flex-1 text-lg font-bold">{t("pendingCta", { count: pending })}</span>
        <ArrowRight className="size-5" />
      </Link>

      {/* ---- Messages de contact non lus (F3.4) ---- */}
      {data.messages.unread > 0 && (
        <Link href="/admin/messages"
          className="flex items-center gap-4 rounded-2xl bg-accent-light p-5 text-ink ring-1 ring-accent/30 transition hover:ring-accent">
          <Mail className="size-6 text-accent" />
          <span className="flex-1 font-semibold">{t("unreadMessages", { count: data.messages.unread })}</span>
          <ArrowRight className="size-5 text-accent" />
        </Link>
      )}

      {/* ---- Dossiers par statut ---- */}
      <section className={card}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className={sectionTitle}><FolderKanban className="size-5 text-accent" /> {t("teams")}</h2>
          <Link href="/admin/teams" className={btn.outline}>{t("manageTeams")} <ArrowRight className="size-4" /></Link>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {STATUS_ORDER.map((s) => (
            <Link key={s} href={`/admin/teams?status=${s}`}
              className={`rounded-xl p-4 transition hover:scale-[1.02] ${STATUS_STYLES[s]}`}>
              <p className="text-xs font-bold uppercase">{ts(s)}</p>
              <p className="text-3xl font-extrabold">{teams[s] || 0}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ---- Contenu du site (Module 1) ---- */}
      <div className="grid gap-6 lg:grid-cols-3">
        <section className={`${card} flex flex-col`}>
          <h2 className={sectionTitle}><Megaphone className="size-5 text-accent" /> {t("news")}</h2>
          <ul className="mt-4 flex flex-1 flex-col gap-1.5 text-sm text-slate-600">
            <li>{t("newsPublished", { count: newsCounts.published || 0 })}</li>
            <li>{t("newsScheduled", { count: newsCounts.scheduled || 0 })}</li>
            <li>{t("newsDrafts", { count: newsCounts.draft || 0 })}</li>
          </ul>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/admin/news/new" className={btn.primary}><Plus className="size-4" /> {t("newAnnouncement")}</Link>
            <Link href="/admin/news" className={btn.outline}>{t("manage")}</Link>
          </div>
        </section>

        <section className={`${card} flex flex-col`}>
          <h2 className={sectionTitle}><Handshake className="size-5 text-accent" /> {t("sponsors")}</h2>
          <p className="mt-4 flex-1 text-sm text-slate-600">{t("sponsorsCount", { count: data.sponsors.sponsors.length })}</p>
          <Link href="/admin/sponsors" className={`${btn.outline} mt-5 w-fit`}>{t("manage")}</Link>
        </section>

        <section className={`${card} flex flex-col`}>
          <h2 className={sectionTitle}><CalendarRange className="size-5 text-accent" /> {t("editions")}</h2>
          <p className="mt-4 flex-1 text-sm text-slate-600">{t("editionsText")}</p>
          <Link href="/admin/editions" className={`${btn.outline} mt-5 w-fit`}>{t("manage")}</Link>
        </section>
      </div>

      {/* ---- Comptes par rôle ---- */}
      <section className={card}>
        <h2 className={sectionTitle}><UserCog className="size-5 text-accent" /> {t("users")}</h2>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {ROLE_ORDER.map((r) => (
            <div key={r} className="rounded-xl bg-surface p-4">
              <p className="text-xs font-bold uppercase text-slate-500">{tc(`roles.${r}`)}</p>
              <p className="text-3xl font-extrabold text-primary">{users[r] || 0}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function AdminPage() {
  return (
    <RequireAuth roles={["admin"]}>
      {(user) => (
        <AppShell user={user}>
          <AdminHome />
        </AppShell>
      )}
    </RequireAuth>
  );
}
