"use client";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AlertTriangle, FileSpreadsheet, FileText, Gavel, Trophy, X, Check } from "lucide-react";
import { Alert, ErrorAlert } from "@/components/ui/Alert";
import { btn, card, sectionTitle } from "@/components/ui/styles";
import { smallInput } from "@/components/admin/content/TextPair";
import { saveDeliberation, exportEvaluations } from "@/lib/evaluation";

// F6.7 : décision du jury de délibération pour une équipe
function DeliberationForm({ team, scale, onDone, onCancel }) {
  const t = useTranslations("evaluation");
  const [score, setScore] = useState(team.deliberation?.finalScore ?? team.average ?? "");
  const [note, setNote] = useState(team.deliberation?.note ?? "");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const save = async (finalScore) => {
    setBusy(true);
    setError(null);
    try {
      await saveDeliberation(team.id, finalScore, note);
      await onDone();
    } catch (err) {
      setError(err);
      setBusy(false);
    }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); save(Number(score)); }} className="mt-2 flex flex-col gap-2 rounded-xl bg-surface p-3">
      <ErrorAlert error={error} />
      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="flex items-center gap-1 text-sm font-semibold text-primary">
          <input type="number" min="0" max={scale} step="any" required className={`${smallInput} w-24`}
            aria-label={t("results.finalScore")} value={score} onChange={(e) => setScore(e.target.value)} />
          /{scale}
        </label>
        <input className={`${smallInput} flex-1`} required placeholder={t("results.decisionNote")} aria-label={t("results.decisionNote")}
          value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={busy} className={btn.secondary}><Check className="size-4" /> {t("save")}</button>
        {team.deliberation && (
          <button type="button" disabled={busy} className={btn.danger} onClick={() => save(null)}>{t("results.clearDecision")}</button>
        )}
        <button type="button" className={btn.ghost} onClick={onCancel}><X className="size-4" /> {t("cancel")}</button>
      </div>
    </form>
  );
}

// F6.4 / F6.7 / F6.8 : résultats par équipe, écarts et export
export default function ResultsPanel({ data, onChanged }) {
  const t = useTranslations("evaluation");
  const locale = useLocale();
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState(null);
  const { grid, teams, counts } = data;

  // Classement provisoire : note retenue décroissante, équipes sans note à la fin
  const rows = [...teams].sort((a, b) => (b.final ?? -1) - (a.final ?? -1) || a.name.localeCompare(b.name));

  const download = (format) => exportEvaluations(format, locale).catch(setError);

  return (
    <div className="flex flex-col gap-6">
      <section className={card}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className={sectionTitle}><Trophy className="size-5 text-accent" /> {t("results.title")}</h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">{t("results.hint", { gap: grid.gapThreshold, scale: grid.scale })}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={btn.outline} onClick={() => download("xlsx")}>
              <FileSpreadsheet className="size-4" /> Excel
            </button>
            <button type="button" className={btn.outline} onClick={() => download("csv")}>
              <FileText className="size-4" /> CSV
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          <ErrorAlert error={error} />
          {counts.alerts > 0 && <Alert type="error">{t("results.alertsBanner", { count: counts.alerts })}</Alert>}
        </div>

        {rows.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-slate-300 px-6 py-8 text-center text-sm text-slate-500">{t("tracking.noTeams")}</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-2 pr-3">#</th>
                  <th className="px-3 py-2">{t("tracking.team")}</th>
                  <th className="px-3 py-2 text-center">{t("results.done")}</th>
                  <th className="px-3 py-2 text-right">{t("results.average")}</th>
                  <th className="px-3 py-2 text-right">{t("results.gap")}</th>
                  <th className="px-3 py-2 text-right">{t("results.final")}</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {rows.map((team, i) => (
                  <tr key={team.id} className={`border-b border-slate-50 align-top last:border-0 ${team.alert && !team.deliberation ? "bg-red-50/50" : ""}`}>
                    <td className="py-3 pr-3 font-bold text-slate-400">{team.final !== null ? i + 1 : "—"}</td>
                    <td className="px-3 py-3">
                      <p className="font-semibold text-primary">{team.name}</p>
                      {team.deliberation && (
                        <p className="mt-0.5 text-xs text-slate-500"><Gavel className="mr-1 inline size-3" />{team.deliberation.note}</p>
                      )}
                      {editing === team.id && (
                        <DeliberationForm team={team} scale={grid.scale}
                          onCancel={() => setEditing(null)}
                          onDone={async () => { setEditing(null); await onChanged(); }} />
                      )}
                    </td>
                    <td className="px-3 py-3 text-center">{team.submittedCount}/{team.evaluations.length}</td>
                    <td className="px-3 py-3 text-right">{team.average ?? "—"}</td>
                    <td className={`px-3 py-3 text-right ${team.alert ? "font-bold text-red-600" : ""}`}>
                      {team.gap ?? "—"}
                      {team.alert && <AlertTriangle className="ml-1 inline size-4" aria-label={t("results.gapAlert")} />}
                    </td>
                    <td className="px-3 py-3 text-right text-base font-extrabold text-primary">
                      {team.final ?? "—"}
                      {team.deliberation && <span className="ml-1 text-[10px] font-bold uppercase text-accent">{t("results.moderated")}</span>}
                    </td>
                    <td className="px-3 py-3 text-right">
                      {editing !== team.id && team.submittedCount > 0 && (
                        <button type="button" className={btn.ghost} onClick={() => setEditing(team.id)}>
                          <Gavel className="size-4" /> {team.deliberation ? t("results.editDecision") : t("results.deliberate")}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-xs text-slate-500">{t("results.confidential")}</p>
      </section>
    </div>
  );
}