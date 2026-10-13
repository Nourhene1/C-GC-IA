"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Shuffle, X, Plus, UserRound, AlertTriangle, Users } from "lucide-react";
import { Alert, ErrorAlert } from "@/components/ui/Alert";
import { btn, card, sectionTitle } from "@/components/ui/styles";
import { EVALUATION_STATUS_STYLES, autoAssign, assignEvaluator, unassignEvaluation } from "@/lib/evaluation";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EvaluationDetailModal from "./EvaluationDetailModal";

function Tile({ label, value, tone = "text-primary" }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-md shadow-primary/5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-extrabold ${tone}`}>{value}</p>
    </div>
  );
}

function Progress({ done, total }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-slate-500">{done}/{total}</span>
    </div>
  );
}

// Ajout manuel d'un évaluateur à une équipe
function AddEvaluator({ team, evaluators, onAdd }) {
  const t = useTranslations("evaluation");
  const taken = new Set(team.evaluations.map((e) => String(e.evaluator?.id)));
  const free = evaluators.filter((e) => !taken.has(String(e.id)));
  const [value, setValue] = useState("");
  if (free.length === 0) return null;

  return (
    <div className="flex items-center gap-1">
      <select value={value} onChange={(e) => setValue(e.target.value)} aria-label={t("tracking.addEvaluator")}
        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-ink outline-none focus:border-accent">
        <option value="">{t("tracking.addEvaluator")}</option>
        {free.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
      </select>
      <button type="button" disabled={!value} className={btn.ghost} aria-label={t("tracking.add")}
        onClick={() => { onAdd(team.id, value); setValue(""); }}>
        <Plus className="size-4" />
      </button>
    </div>
  );
}

const FILTERS = ["all", "unfinished", "finished", "unassigned"];

// F6.2 + F6.6 : affectations et état d'avancement, pour une étape ("final" ou "pre")
export default function TrackingPanel({ data, stage = "final", onChanged }) {
  const t = useTranslations("evaluation");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState("all");
  const [openId, setOpenId] = useState(null);
  const [toRemove, setToRemove] = useState(null);
  const { counts, evaluators, teams, grid } = data;

  const noEvaluatorsText = stage === "pre" ? t("admin.noPilotage") : t("tracking.noJury");

  const run = async (fn) => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await fn();
      await onChanged?.();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  // L'étape est transmise à chaque appel : sans elle, l'affectation partirait dans le jury
  const auto = () => run(async () => {
    const res = await autoAssign(stage);
    setMessage(res.created ? t("tracking.autoDone", { count: res.created }) : t("tracking.autoNothing"));
    if (res.notEnoughEvaluators) setError("NOT_ENOUGH_JURY");
  });
  const add = (teamId, evaluatorId) => run(() => assignEvaluator(teamId, evaluatorId, stage));
  const confirmRemove = async () => {
    await run(() => unassignEvaluation(toRemove.id));
    setToRemove(null);
  };

  const visible = teams.filter((team) => {
    const done = team.evaluations.filter((e) => e.status === "submitted").length;
    if (filter === "unassigned") return team.evaluations.length === 0;
    if (filter === "finished") return team.evaluations.length > 0 && done === team.evaluations.length;
    if (filter === "unfinished") return team.evaluations.length === 0 || done < team.evaluations.length;
    return true;
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Tile label={t("tracking.teams")} value={counts.teams} />
        <Tile label={t("tiles.pending")} value={counts.pending} tone="text-slate-600" />
        <Tile label={t("tiles.draft")} value={counts.draft} tone="text-amber-600" />
        <Tile label={t("tiles.submitted")} value={`${counts.submitted}/${counts.total}`} tone="text-emerald-600" />
        <Tile label={t("tracking.alerts")} value={counts.alerts} tone={counts.alerts ? "text-red-600" : "text-primary"} />
      </div>

      {!grid.ready && <Alert type="info">{t("tracking.gridNotReady")}</Alert>}

      <section className={card}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className={sectionTitle}><Shuffle className="size-5 text-accent" /> {t("tracking.assignTitle")}</h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              {t("tracking.assignHint", { n: grid.evaluatorsPerTeam })}
            </p>
          </div>
          <button type="button" onClick={auto} disabled={busy} className={btn.primary}>
            <Shuffle className="size-4" /> {t("tracking.autoAssign")}
          </button>
        </div>
        <div className="mt-4 flex flex-col gap-3">
          <ErrorAlert error={error} />
          {message && <Alert type="success">{message}</Alert>}
          {counts.teamsWithoutEvaluator > 0 && (
            <Alert type="info">{t("tracking.teamsWithout", { count: counts.teamsWithoutEvaluator })}</Alert>
          )}
        </div>
      </section>

      <section className={card}>
        <h2 className={sectionTitle}><UserRound className="size-5 text-accent" /> {t("tracking.byEvaluator")}</h2>
        {evaluators.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">{noEvaluatorsText}</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-2 pr-3">{t("tracking.evaluator")}</th>
                  <th className="px-3 py-2 text-center">{t("tracking.assigned")}</th>
                  <th className="px-3 py-2 text-center">{t("status.pending")}</th>
                  <th className="px-3 py-2 text-center">{t("status.draft")}</th>
                  <th className="px-3 py-2">{t("tracking.progress")}</th>
                </tr>
              </thead>
              <tbody>
                {evaluators.map((e) => (
                  <tr key={e.id} className="border-b border-slate-50 last:border-0">
                    <td className="py-2.5 pr-3">
                      <p className="font-semibold text-primary">{e.name}</p>
                      <p className="text-xs text-slate-500">
                        {e.email}{!e.active && <span className="ml-2 rounded bg-amber-50 px-1.5 py-0.5 font-semibold text-amber-700">{t("tracking.notActivated")}</span>}
                      </p>
                    </td>
                    <td className="px-3 py-2.5 text-center font-semibold">{e.assigned}</td>
                    <td className="px-3 py-2.5 text-center">{e.pending}</td>
                    <td className="px-3 py-2.5 text-center">{e.draft}</td>
                    <td className="px-3 py-2.5"><Progress done={e.submitted} total={e.assigned} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className={card}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className={sectionTitle}><Users className="size-5 text-accent" /> {t("tracking.byTeam")}</h2>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label={t("tracking.filter")}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-accent">
            {FILTERS.map((f) => <option key={f} value={f}>{t(`tracking.filters.${f}`)}</option>)}
          </select>
        </div>

        {visible.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-slate-300 px-6 py-8 text-center text-sm text-slate-500">
            {teams.length === 0 ? t("tracking.noTeams") : t("tracking.noMatch")}
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-2 pr-3">{t("tracking.team")}</th>
                  <th className="px-3 py-2">{t("tracking.evaluators")}</th>
                  <th className="px-3 py-2 text-right">{t("results.average")}</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((team) => (
                  <tr key={team.id} className="border-b border-slate-50 align-top last:border-0">
                    <td className="py-3 pr-3">
                      <p className="font-semibold text-primary">{team.name}</p>
                      {team.anonCode && <p className="text-xs text-slate-400">{team.anonCode}</p>}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {team.evaluations.length === 0 && (
                          <span className="text-xs font-semibold text-red-600">{t("tracking.none")}</span>
                        )}
                        {team.evaluations.map((ev) => (
                          <span key={ev.id} className={`inline-flex items-center gap-1 rounded-full py-1 pl-3 pr-1 text-xs font-semibold ${EVALUATION_STATUS_STYLES[ev.status]}`}>
                            <button type="button" onClick={() => setOpenId(ev.id)} className="hover:underline"
                              title={t(`status.${ev.status}`)}>
                              {ev.evaluator?.name ?? "?"}{ev.status === "submitted" && ` · ${ev.total}`}
                            </button>
                            {ev.status !== "submitted" ? (
                              <button type="button" onClick={() => setToRemove(ev)} aria-label={t("tracking.remove")}
                                className="rounded-full p-0.5 hover:bg-black/10"><X className="size-3" /></button>
                            ) : <span className="w-1" />}
                          </span>
                        ))}
                        <AddEvaluator team={team} evaluators={evaluators} onAdd={add} />
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right">
                      {team.average ?? "—"}
                      {team.alert && !team.deliberation && (
                        <AlertTriangle className="ml-1 inline size-4 text-red-500" aria-label={t("results.gapAlert")} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-xs text-slate-500">{t("tracking.chipHint")}</p>
      </section>

      <ConfirmDialog
        open={!!toRemove}
        tone="danger"
        title={t("tracking.removeTitle")}
        confirmLabel={t("tracking.remove")}
        cancelLabel={t("cancel")}
        busy={busy}
        onCancel={() => setToRemove(null)}
        onConfirm={confirmRemove}
      >
        {t("tracking.confirmRemove", { name: toRemove?.evaluator?.name ?? "" })}
      </ConfirmDialog>

      {openId && (
        <EvaluationDetailModal evaluationId={openId} onClose={() => setOpenId(null)} onChanged={onChanged} />
      )}
    </div>
  );
}