"use client";
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Users, Building2, GraduationCap, UserRound, Mail, Pencil, ImagePlus, Trash2 } from "lucide-react";
import Field from "@/components/ui/Field";
import StatusBadge from "@/components/ui/StatusBadge";
import { ErrorAlert } from "@/components/ui/Alert";
import { btn, card } from "@/components/ui/styles";
import TeamLogo from "./TeamLogo";
import { api } from "@/lib/api";
import { LOGO_ACCEPT, LOGO_MAX_MB } from "@/lib/constants";

// F2.2 : informations de l'équipe + logo, modifiables par le chef
export default function TeamInfoSection({ team, canEdit, onChange }) {
  const t = useTranslations("teamPage");
  const tt = useTranslations("team");
  const tc = useTranslations("common");
  const fileInput = useRef(null);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const startEdit = () => {
    setForm({
      name: team.name,
      etablissement: team.etablissement,
      filiere: team.filiere,
      coachNom: team.coach?.nom || "",
      coachEmail: team.coach?.email || "",
    });
    setError(null);
    setEditing(true);
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api("/api/teams/me", {
        method: "PUT",
        body: {
          name: form.name,
          etablissement: form.etablissement,
          filiere: form.filiere,
          coach: { nom: form.coachNom, email: form.coachEmail },
        },
      });
      setEditing(false);
      await onChange();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  const uploadLogo = async (e) => {
    const file = e.target.files[0];
    e.target.value = ""; // permet de choisir à nouveau le même fichier
    if (!file) return;
    if (file.size > LOGO_MAX_MB * 1024 * 1024) return setError("FILE_TOO_LARGE");

    const data = new FormData();
    data.append("file", file);
    setBusy(true);
    setError(null);
    try {
      await api("/api/teams/me/logo", { method: "POST", body: data });
      await onChange();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  const removeLogo = async () => {
    setBusy(true);
    try {
      await api("/api/teams/me/logo", { method: "DELETE" });
      await onChange();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={card}>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div className="flex flex-col items-center gap-2">
          <TeamLogo logo={team.logo} name={team.name} size="size-24" />
          {canEdit && (
            <>
              <input ref={fileInput} type="file" accept={LOGO_ACCEPT} className="hidden" onChange={uploadLogo} />
              <button type="button" onClick={() => fileInput.current.click()} disabled={busy} className={btn.ghost}>
                <ImagePlus className="size-4" /> {team.logo ? t("changeLogo") : t("addLogo")}
              </button>
              {team.logo && (
                <button type="button" onClick={removeLogo} disabled={busy} className={btn.danger}>
                  <Trash2 className="size-4" /> {t("removeLogo")}
                </button>
              )}
              <p className="max-w-32 text-center text-[11px] text-slate-400">{t("logoHint", { max: LOGO_MAX_MB })}</p>
            </>
          )}
        </div>

        <div className="min-w-0 flex-1">
          {!editing ? (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-extrabold text-primary sm:text-3xl">{team.name}</h1>
                <StatusBadge status={team.status} />
              </div>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <Building2 className="size-4 text-accent" />
                  <dt className="sr-only">{tt("etablissement")}</dt>
                  <dd>{team.etablissement}</dd>
                </div>
                <div className="flex items-center gap-2">
                  <GraduationCap className="size-4 text-accent" />
                  <dt className="sr-only">{tt("filiere")}</dt>
                  <dd>{team.filiere}</dd>
                </div>
                <div className="flex items-center gap-2 sm:col-span-2">
                  <UserRound className="size-4 text-accent" />
                  <dt className="font-semibold text-primary">{t("coach")} :</dt>
                  <dd className="text-slate-600">
                    {team.coach?.nom
                      ? `${team.coach.nom}${team.coach.email ? ` — ${team.coach.email}` : ""}`
                      : t("noCoach")}
                  </dd>
                </div>
              </dl>
              {canEdit && (
                <button onClick={startEdit} className={`${btn.outline} mt-5`}>
                  <Pencil className="size-4" /> {tc("edit")}
                </button>
              )}
              <ErrorAlert error={error} className="mt-4" />
            </>
          ) : (
            <form onSubmit={save} className="flex flex-col gap-4">
              <h2 className="text-lg font-bold text-primary">{t("infoTitle")}</h2>
              <ErrorAlert error={error} />
              <Field label={tt("name")} icon={Users} name="name" value={form.name}
                onChange={handleChange} required maxLength={60} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={tt("etablissement")} icon={Building2} name="etablissement"
                  value={form.etablissement} onChange={handleChange} required />
                <Field label={tt("filiere")} icon={GraduationCap} name="filiere"
                  value={form.filiere} onChange={handleChange} required />
                <Field label={tt("coachName")} icon={UserRound} name="coachNom"
                  value={form.coachNom} onChange={handleChange} />
                <Field label={tt("coachEmail")} icon={Mail} type="email" name="coachEmail"
                  value={form.coachEmail} onChange={handleChange} />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setEditing(false)} className={btn.outline}>{tc("cancel")}</button>
                <button type="submit" disabled={busy} className={btn.primary}>
                  {busy ? tc("saving") : tc("save")}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
