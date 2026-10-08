"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations, useFormatter } from "next-intl";
import {
  Users, Building2, GraduationCap, UserRound, Mail, ArrowRight, ArrowLeft, CalendarX, BookOpen,
} from "lucide-react";
import RequireAuth from "@/components/auth/RequireAuth";
import AppShell from "@/components/layout/AppShell";
import Field from "@/components/ui/Field";
import { Alert, ErrorAlert } from "@/components/ui/Alert";
import { btn } from "@/components/ui/styles";
import { api } from "@/lib/api";
import { useEdition } from "@/lib/useEdition";
import { DATE_LONG } from "@/lib/format";

const ETABLISSEMENTS = [
  "ISET Siliana",
  "ISET Gafsa",
  "ISET Nabeul",
  "ISET Radès",
  "ISET Médenine",
  "ISET Tozeur",
  "ISET Sfax",
  "ISSAT Sousse",
  "ISSAT Gabès",
  "IIT",
  "IPSAS",
];

const FILIERES = ["IT", "GC"];

const NIVEAUX = ["L1", "L2", "L3", "M1", "M2", "ING 1", "ING 2", "ING3"];

const selectClass =
  "rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

// F2.2 : formulaire d'inscription de l'équipe
function CreateTeamForm({ user }) {
  const t = useTranslations("team");
  const format = useFormatter();
  const router = useRouter();
  const { edition, registrationOpen } = useEdition();

  const [form, setForm] = useState({
    name: "", etablissement: "", filiere: "", niveau: "", coachNom: "", coachEmail: "",
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Équipe déjà créée : ce formulaire n'a plus lieu d'être
  useEffect(() => {
    if (user.team) router.replace("/team");
  }, [user.team, router]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api("/api/teams", {
        method: "POST",
        body: {
          name: form.name,
          etablissement: form.etablissement,
          filiere: form.filiere,
          niveau: form.niveau,
          coach: { nom: form.coachNom, email: form.coachEmail },
        },
      });
      router.push("/team");
    } catch (err) {
      setError(err);
      setLoading(false);
    }
  };

  const closed = edition && !registrationOpen;

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/dashboard" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-accent">
        <ArrowLeft className="size-4" /> {t("back")}
      </Link>

      <div className="overflow-hidden rounded-3xl bg-white shadow-2xl shadow-primary/10">
        <div className="relative overflow-hidden bg-primary px-8 py-8 text-white sm:px-10">
          <span className="absolute -right-10 -top-6 h-5 w-48 rotate-[-30deg] bg-accent" />
          <h1 className="flex items-center gap-3 text-3xl font-bold">
            <Users className="size-8" strokeWidth={2.2} /> {t("title")}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-white/85">{t("subtitle")}</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6 px-8 py-8 sm:px-10">
          {closed && (
            <Alert type="info">
              <p className="flex items-center gap-2 font-semibold text-primary">
                <CalendarX className="size-4" /> {t("closedTitle")}
              </p>
              <p>
                {t("closedText", {
                  open: format.dateTime(new Date(edition.dates.registrationOpen), DATE_LONG),
                  close: format.dateTime(new Date(edition.dates.registrationClose), DATE_LONG),
                })}
              </p>
            </Alert>
          )}

          <ErrorAlert error={error} />

          <fieldset disabled={closed || loading} className="flex flex-col gap-6">
            <Field label={t("name")} icon={Users} name="name" placeholder={t("namePlaceholder")}
              value={form.name} onChange={handleChange} required maxLength={60} />

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label htmlFor="etablissement" className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <Building2 className="size-4" /> {t("etablissement")}
                </label>
                <select
                  id="etablissement"
                  name="etablissement"
                  value={form.etablissement}
                  onChange={handleChange}
                  required
                  className={selectClass}
                >
                  <option value="" disabled>{t("etablissementPlaceholder")}</option>
                  {ETABLISSEMENTS.map((nom) => (
                    <option key={nom} value={nom}>{nom}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="filiere" className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <GraduationCap className="size-4" /> {t("filiere")}
                </label>
                <select
                  id="filiere"
                  name="filiere"
                  value={form.filiere}
                  onChange={handleChange}
                  required
                  className={selectClass}
                >
                  <option value="" disabled>{t("filierePlaceholder")}</option>
                  {FILIERES.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="niveau" className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <BookOpen className="size-4" /> {t("niveau")}
                </label>
                <select
                  id="niveau"
                  name="niveau"
                  value={form.niveau}
                  onChange={handleChange}
                  required
                  className={selectClass}
                >
                  <option value="" disabled>{t("niveauPlaceholder")}</option>
                  {NIVEAUX.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 p-5">
              <p className="mb-4 flex items-center justify-between text-sm font-bold uppercase tracking-wide text-primary">
                {t("coachSection")}
                <span className="text-xs font-medium normal-case text-slate-400">{t("optional")}</span>
              </p>
              <div className="grid gap-6 sm:grid-cols-2">
                <Field label={t("coachName")} icon={UserRound} name="coachNom"
                  value={form.coachNom} onChange={handleChange} />
                <Field label={t("coachEmail")} icon={Mail} type="email" name="coachEmail"
                  value={form.coachEmail} onChange={handleChange} />
              </div>
            </div>

            <button type="submit" className={`${btn.primary} self-end px-8 py-3.5`}>
              {loading ? t("submitting") : <>{t("submit")} <ArrowRight className="size-4" /></>}
            </button>
          </fieldset>
        </form>
      </div>
    </div>
  );
}

export default function CreateTeamPage() {
  return (
    <RequireAuth roles={["chef"]}>
      {(user) => (
        <AppShell user={user}>
          <CreateTeamForm user={user} />
        </AppShell>
      )}
    </RequireAuth>
  );
}