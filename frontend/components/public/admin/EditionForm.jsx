"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Save, Plus, Trash2, ImagePlus, CalendarDays, Users, BarChart3, Trophy, Info } from "lucide-react";
import BilingualField from "./BilingualField";
import Field from "@/components/ui/Field";
import { Alert, ErrorAlert } from "@/components/ui/Alert";
import { btn, card, sectionTitle } from "@/components/ui/styles";
import { api, publicFileUrl } from "@/lib/api";
import { toDateTimeInput, fromDateTimeInput } from "@/lib/content";

const DATE_KEYS = ["registrationOpen", "registrationClose", "sessionOpen", "submissionDeadline", "evaluationStart", "evaluationEnd", "resultsDate"];
const OPTIONAL_DATES = ["evaluationStart", "evaluationEnd", "resultsDate"];

// Transforme l'édition reçue de l'API en valeurs de formulaire
function toForm(e) {
  return {
    year: e?.year ?? new Date().getFullYear() + 1,
    title: { fr: e?.title?.fr || "", en: e?.title?.en || "" },
    theme: { fr: e?.theme?.fr || "", en: e?.theme?.en || "" },
    dates: Object.fromEntries(DATE_KEYS.map((k) => [k, toDateTimeInput(e?.dates?.[k])])),
    teamSize: { min: e?.teamSize?.min ?? 2, max: e?.teamSize?.max ?? 5 },
    stats: { teams: e?.stats?.teams ?? 0, participants: e?.stats?.participants ?? 0, schools: e?.stats?.schools ?? 0 },
    subjectSummary: { fr: e?.subjectSummary?.fr || "", en: e?.subjectSummary?.en || "" },
    winners: e?.winners?.length ? e.winners : [],
  };
}

// Formulaire d'une édition : informations, dates, taille des équipes, chiffres, historique
export default function EditionForm({ initial }) {
  const t = useTranslations("adminEditions");
  const tcd = useTranslations("countdown");
  const tc = useTranslations("common");
  const router = useRouter();
  const posterInput = useRef(null);
  const isEdit = Boolean(initial?._id);

  const [form, setForm] = useState(() => toForm(initial));
  const [poster, setPoster] = useState(initial?.poster || null);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));
  const setNested = (key, sub, value) => setForm((f) => ({ ...f, [key]: { ...f[key], [sub]: value } }));

  const setWinner = (i, field, value) =>
    setForm((f) => ({ ...f, winners: f.winners.map((w, j) => (j === i ? { ...w, [field]: value } : w)) }));
  const addWinner = () =>
    setForm((f) => ({ ...f, winners: [...f.winners, { rank: f.winners.length + 1, teamName: "", etablissement: "" }] }));
  const removeWinner = (i) => setForm((f) => ({ ...f, winners: f.winners.filter((_, j) => j !== i) }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const body = {
        ...form,
        year: Number(form.year),
        dates: Object.fromEntries(DATE_KEYS.map((k) => [k, fromDateTimeInput(form.dates[k])])),
        teamSize: { min: Number(form.teamSize.min), max: Number(form.teamSize.max) },
        stats: Object.fromEntries(Object.entries(form.stats).map(([k, v]) => [k, Number(v) || 0])),
      };
      const res = await api(isEdit ? `/api/admin/editions/${initial._id}` : "/api/admin/editions", {
        method: isEdit ? "PUT" : "POST",
        body,
      });
      if (isEdit) setSaved(true);
      else router.replace(`/admin/editions/${res.edition._id}`); // pour pouvoir ajouter l'affiche
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  const uploadPoster = async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    const data = new FormData();
    data.append("file", file);
    try {
      const res = await api(`/api/admin/editions/${initial._id}/poster`, { method: "POST", body: data });
      setPoster(res.poster);
    } catch (err) {
      setError(err);
    }
  };

  const removePoster = async () => {
    await api(`/api/admin/editions/${initial._id}/poster`, { method: "DELETE" }).catch(setError);
    setPoster(null);
  };

  const numberInput = "w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-accent focus:ring-4 focus:ring-accent/15";

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      {/* ---- Informations générales ---- */}
      <section className={`${card} flex flex-col gap-5`}>
        <h2 className={sectionTitle}><Info className="size-5 text-accent" /> {t("general")}</h2>
        <Field label={t("year")} type="number" min={2000} max={2100} value={form.year}
          onChange={(e) => set("year")(e.target.value)} required className="max-w-40" />
        <BilingualField label={t("titleField")} value={form.title} onChange={set("title")} required />
        <BilingualField label={t("theme")} value={form.theme} onChange={set("theme")} required />
      </section>

      {/* ---- Dates clés (F1.3, F2.5, F4.2, F5.1) ---- */}
      <section className={card}>
        <h2 className={sectionTitle}><CalendarDays className="size-5 text-accent" /> {t("dates")}</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {DATE_KEYS.map((k) => (
            <label key={k} className="block">
              <span className="mb-1.5 block text-sm font-semibold text-primary">
                {tcd(`label.${k}`)}
                {!OPTIONAL_DATES.includes(k) && <span className="text-accent"> *</span>}
              </span>
              <input type="datetime-local" required={!OPTIONAL_DATES.includes(k)} value={form.dates[k]}
                onChange={(e) => setNested("dates", k, e.target.value)} className={numberInput} />
            </label>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ---- Taille des équipes (F2.3) ---- */}
        <section className={card}>
          <h2 className={sectionTitle}><Users className="size-5 text-accent" /> {t("teamSize")}</h2>
          <div className="mt-5 grid grid-cols-2 gap-4">
            <Field label={t("min")} type="number" min={1} value={form.teamSize.min} required
              onChange={(e) => setNested("teamSize", "min", e.target.value)} />
            <Field label={t("max")} type="number" min={1} value={form.teamSize.max} required
              onChange={(e) => setNested("teamSize", "max", e.target.value)} />
          </div>
        </section>

        {/* ---- Chiffres affichés sur l'accueil (F1.1) ---- */}
        <section className={card}>
          <h2 className={sectionTitle}><BarChart3 className="size-5 text-accent" /> {t("stats")}</h2>
          <p className="mt-1 text-xs text-slate-500">{t("statsHint")}</p>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {["teams", "participants", "schools"].map((k) => (
              <Field key={k} label={t(`stat_${k}`)} type="number" min={0} value={form.stats[k]}
                onChange={(e) => setNested("stats", k, e.target.value)} />
            ))}
          </div>
        </section>
      </div>

      {/* ---- Historique : affiche, sujet, gagnants (F1.1) ---- */}
      <section className={`${card} flex flex-col gap-6`}>
        <div>
          <h2 className={sectionTitle}><Trophy className="size-5 text-accent" /> {t("archive")}</h2>
          <p className="mt-1 text-xs text-slate-500">{t("archiveHint")}</p>
        </div>

        {isEdit ? (
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-40 w-32 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-surface">
              {poster ? (
                // eslint-disable-next-line @next/next/no-img-element -- image servie par l'API
                <img src={publicFileUrl(poster)} alt="" className="size-full object-cover" />
              ) : (
                <ImagePlus className="size-8 text-slate-300" />
              )}
            </div>
            <input ref={posterInput} type="file" accept=".png,.jpg,.jpeg,.webp" className="hidden" onChange={uploadPoster} />
            <div className="flex flex-col items-start gap-2">
              <button type="button" onClick={() => posterInput.current.click()} className={btn.outline}>
                <ImagePlus className="size-4" /> {poster ? t("changePoster") : t("addPoster")}
              </button>
              {poster && (
                <button type="button" onClick={removePoster} className={btn.danger}><Trash2 className="size-4" /> {t("removePoster")}</button>
              )}
              <p className="text-xs text-slate-500">{t("posterHint")}</p>
            </div>
          </div>
        ) : (
          <Alert type="info">{t("posterAfterCreate")}</Alert>
        )}

        <BilingualField label={t("subjectSummary")} value={form.subjectSummary} onChange={set("subjectSummary")} multiline />

        <div>
          <p className="mb-2 text-sm font-semibold text-primary">{t("winners")}</p>
          <div className="flex flex-col gap-2">
            {form.winners.map((w, i) => (
              <div key={i} className="grid grid-cols-[4rem_1fr_auto] gap-2 sm:grid-cols-[4rem_1fr_1fr_auto]">
                <input type="number" min={1} value={w.rank} aria-label={t("rank")}
                  onChange={(e) => setWinner(i, "rank", e.target.value)} className={numberInput} />
                <input value={w.teamName} placeholder={t("teamName")} aria-label={t("teamName")}
                  onChange={(e) => setWinner(i, "teamName", e.target.value)} className={numberInput} />
                <input value={w.etablissement} placeholder={t("etablissement")} aria-label={t("etablissement")}
                  onChange={(e) => setWinner(i, "etablissement", e.target.value)}
                  className={`${numberInput} col-span-2 row-start-2 sm:col-span-1 sm:row-start-auto`} />
                <button type="button" onClick={() => removeWinner(i)} className={`${btn.danger} row-start-1 sm:row-start-auto`}
                  aria-label={tc("delete")}>
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addWinner} className={`${btn.ghost} mt-2`}><Plus className="size-4" /> {t("addWinner")}</button>
        </div>
      </section>

      <div className="sticky bottom-4 flex flex-col gap-3 rounded-2xl bg-white/95 p-4 shadow-xl ring-1 ring-slate-200 backdrop-blur">
        <ErrorAlert error={error} />
        {saved && <Alert type="success">{t("saved")}</Alert>}
        <button type="submit" disabled={busy} className={`${btn.primary} self-end px-8 py-3`}>
          <Save className="size-4" /> {busy ? tc("saving") : tc("save")}
        </button>
      </div>
    </form>
  );
}
