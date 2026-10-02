"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, ExternalLink, Lock, Save, Send, FolderOpen, ClipboardList } from "lucide-react";
import Spinner from "@/components/ui/Spinner";
import { Alert, ErrorAlert } from "@/components/ui/Alert";
import { btn, card, sectionTitle } from "@/components/ui/styles";
import DownloadButton from "@/components/submission/DownloadButton";
import { downloadJuryVersion, formatSize } from "@/lib/submission";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EvalStatusBadge from "./EvalStatusBadge";
import {
  getMyEvaluation, saveMyEvaluation, submitMyEvaluation, localized, previewTotal,
} from "@/lib/evaluation";

const scoreInput =
  "w-20 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-center text-sm font-bold text-primary outline-none focus:border-accent focus:ring-4 focus:ring-accent/15 disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-500";

// Livrables de l'équipe (dernière version), téléchargés par la route jury du Module 5
function Deliverables({ submissionId, deliverables }) {
  const t = useTranslations("submission");
  const te = useTranslations("evaluation");
  return (
    <section className={card}>
      <h2 className={sectionTitle}><FolderOpen className="size-5 text-accent" /> {te("form.deliverables")}</h2>
      <ul className="mt-4 flex flex-col gap-2">
        {deliverables.map(({ kind, version }) => (
          <li key={kind} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-3">
            <div className="min-w-0">
              <p className="text-sm font-bold text-primary">{t(`kinds.${kind}`)}</p>
              <p className="truncate text-xs text-slate-500">
                {version ? <>{version.name ?? version.url}{version.size != null && ` · ${formatSize(version.size)}`}</> : t("current.none")}
              </p>
            </div>
            {version?.url && (
              <a href={version.url} target="_blank" rel="noopener noreferrer" className={btn.ghost}>
                <ExternalLink className="size-4" /> {t("actions.open")}
              </a>
            )}
            {version && !version.url && submissionId && (
              <DownloadButton fetcher={() => downloadJuryVersion(submissionId, version.id)} filename={version.name ?? "file"} />
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

// F6.3 : saisie des notes par critère + commentaire libre
export default function JuryEvaluationForm({ id }) {
  const t = useTranslations("evaluation");
  const locale = useLocale();
  const [data, setData] = useState(null);
  const [values, setValues] = useState({});
  const [comment, setComment] = useState("");
  const [state, setState] = useState({ busy: false, error: null, message: null });
  const [confirmOpen, setConfirmOpen] = useState(false);

  const load = () =>
    getMyEvaluation(id)
      .then((d) => {
        setData(d);
        setValues(Object.fromEntries(d.evaluation.scores.map((s) => [s.item, String(s.value)])));
        setComment(d.evaluation.comment);
      })
      .catch((error) => setState((s) => ({ ...s, error })));

  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const preview = useMemo(() => (data ? previewTotal(data.grid, values) : null), [data, values]);

  if (!data) return state.error ? <ErrorAlert error={state.error} /> : <Spinner />;

  const { evaluation, grid } = data;
  const locked = evaluation.status === "submitted" || data.closed;
  const body = () => ({
    scores: Object.entries(values).filter(([, v]) => v !== "").map(([item, value]) => ({ item, value: Number(value) })),
    comment,
  });

  const save = async (submit) => {
    setState({ busy: true, error: null, message: null });
    try {
      await (submit ? submitMyEvaluation(id, body()) : saveMyEvaluation(id, body()));
      await load();
      setConfirmOpen(false);
      setState({ busy: false, error: null, message: submit ? t("form.submitted") : t("form.draftSaved") });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setConfirmOpen(false);
      setState({ busy: false, error, message: null });
    }
  };

  const contribution = new Map(preview.byCriterion.map((c) => [String(c.id), c]));
  const scoreField = (leaf) => (
    <input type="number" min="0" max={leaf.max} step="any" disabled={locked} className={scoreInput}
      aria-label={localized(leaf.label, locale)} placeholder="—"
      value={values[leaf._id] ?? ""} onChange={(e) => setValues({ ...values, [leaf._id]: e.target.value })} />
  );
  // Totaux en points bruts (ligne « Total » du tableau)
  const totalMax = preview.byCriterion.reduce((s, c) => s + c.max, 0);
  const totalPoints = Math.round(preview.byCriterion.reduce((s, c) => s + c.points, 0) * 100) / 100;

  return (
    <div className="flex flex-col gap-6">
      <Link href="/jury/evaluations" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-accent">
        <ArrowLeft className="size-4" /> {t("form.back")}
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">{evaluation.label}</h1>
          <div className="mt-2"><EvalStatusBadge status={evaluation.status} /></div>
        </div>
        <div className="rounded-2xl bg-primary px-6 py-4 text-white shadow-lg shadow-primary/20">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/70">{t("form.total")}</p>
          <p className="text-3xl font-extrabold">{preview.total} <span className="text-base font-semibold text-white/60">/ {grid.scale}</span></p>
        </div>
      </div>

      <ErrorAlert error={state.error} />
      {state.message && <Alert type="success">{state.message}</Alert>}
      {evaluation.status === "submitted" && (
        <Alert type="info"><span className="inline-flex items-center gap-1.5"><Lock className="size-4" /> {t("form.lockedText")}</span></Alert>
      )}
      {data.closed && evaluation.status !== "submitted" && <Alert type="info">{t("form.closedText")}</Alert>}

      <Deliverables submissionId={data.submissionId} deliverables={data.deliverables} />

      {grid.criteria.length === 0 ? (
        <Alert type="info">{t("jury.gridNotReady")}</Alert>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); setConfirmOpen(true); }} className="flex flex-col gap-4">
          {/* Grille présentée comme la grille papier : un tableau par critère / sous-critère */}
          <section className={`${card} !p-0 overflow-hidden`}>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-6 py-4">
              <h2 className={sectionTitle}><ClipboardList className="size-5 text-accent" /> {t("form.table.title")}</h2>
              <p className="text-sm text-slate-500">{t("form.table.team")} : <b className="text-primary">{evaluation.label}</b></p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-sm">
                <thead>
                  <tr className="bg-primary text-left text-xs font-bold uppercase tracking-wide text-white">
                    <th className="w-[26%] border border-primary px-4 py-3">{t("form.table.criterion")}</th>
                    <th className="border border-primary px-4 py-3">{t("form.table.detail")}</th>
                    <th className="w-24 border border-primary px-3 py-3 text-center">{t("form.table.max")}</th>
                    <th className="w-36 border border-primary px-3 py-3 text-center">{t("form.table.score")}</th>
                    <th className="w-32 border border-primary px-3 py-3 text-center">{t("form.table.subtotal")}</th>
                  </tr>
                </thead>
                <tbody>
                  {grid.criteria.map((c, i) => {
                    const sum = contribution.get(String(c._id));
                    const leaves = c.subCriteria.length ? c.subCriteria : [c];
                    const shade = i % 2 ? "bg-surface/60" : "bg-white";
                    return leaves.map((leaf, j) => (
                      <tr key={leaf._id} className={shade}>
                        {j === 0 && (
                          <td rowSpan={leaves.length} className="border border-slate-200 px-4 py-3 align-top">
                            <p className="font-bold text-primary">{localized(c.label, locale)}</p>
                            <p className="mt-1 text-xs font-semibold text-accent">
                              {t("form.table.weight", { weight: c.weight, points: sum?.max ?? 0 })}
                            </p>
                            {localized(c.description, locale) && (
                              <p className="mt-1 text-xs text-slate-500">{localized(c.description, locale)}</p>
                            )}
                          </td>
                        )}
                        <td className="border border-slate-200 px-4 py-2.5 text-ink">
                          {c.subCriteria.length ? localized(leaf.label, locale) : <span className="text-slate-500">{t("form.table.direct")}</span>}
                          {c.subCriteria.length > 0 && localized(leaf.description, locale) && (
                            <p className="text-xs text-slate-500">{localized(leaf.description, locale)}</p>
                          )}
                        </td>
                        <td className="border border-slate-200 px-3 py-2.5 text-center font-semibold text-slate-600">
                          {t("form.table.points", { n: leaf.max })}
                        </td>
                        <td className="border border-slate-200 px-3 py-2 text-center">{scoreField(leaf)}</td>
                        {j === 0 && (
                          <td rowSpan={leaves.length} className="border border-slate-200 px-3 py-3 text-center align-middle">
                            <p className="text-lg font-extrabold text-primary">{sum?.points ?? 0} / {sum?.max ?? 0}</p>
                            <p className="text-xs text-slate-500">
                              {t("form.table.weighted", { value: sum?.contribution ?? 0, max: Math.round((c.weight / 100) * grid.scale * 100) / 100 })}
                            </p>
                          </td>
                        )}
                      </tr>
                    ));
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-surface font-bold text-primary">
                    <td colSpan={2} className="border border-slate-200 px-4 py-3 text-right uppercase">{t("form.table.total")}</td>
                    <td className="border border-slate-200 px-3 py-3 text-center">{t("form.table.points", { n: totalMax })}</td>
                    <td className="border border-slate-200 px-3 py-3 text-center">{totalPoints}</td>
                    <td className="border border-slate-200 px-3 py-3" />
                  </tr>
                  <tr>
                    <td colSpan={4} className="border border-slate-200 bg-primary px-4 py-4 text-right text-sm font-bold uppercase tracking-wide text-white">
                      {t("form.table.final", { scale: grid.scale })}
                    </td>
                    <td className="border border-slate-200 bg-accent px-3 py-4 text-center text-2xl font-black text-white">
                      {preview.total}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>

          <section className={card}>
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-primary">{t("form.comment")}</span>
              <textarea rows={5} maxLength={5000} disabled={locked} value={comment} onChange={(e) => setComment(e.target.value)}
                placeholder={t("form.commentPlaceholder")}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none focus:border-accent focus:ring-4 focus:ring-accent/15 disabled:bg-slate-50" />
            </label>
          </section>

          {!locked && (
            <div className="sticky bottom-4 flex flex-wrap items-center justify-end gap-3 rounded-2xl bg-white/95 p-4 shadow-lg shadow-primary/10 backdrop-blur">
              {!preview.complete && <p className="mr-auto text-xs text-slate-500">{t("form.incompleteHint")}</p>}
              <button type="button" disabled={state.busy} onClick={() => save(false)} className={btn.outline}>
                <Save className="size-4" /> {t("form.saveDraft")}
              </button>
              <button type="submit" disabled={state.busy || !preview.complete} className={btn.primary}>
                <Send className="size-4" /> {t("form.submit")}
              </button>
            </div>
          )}
        </form>
      )}

      {/* F6.5 : confirmation avant la validation définitive */}
      <ConfirmDialog
        open={confirmOpen}
        title={t("form.confirmTitle")}
        confirmLabel={state.busy ? t("form.submitting") : t("form.confirmOk")}
        cancelLabel={t("form.confirmCancel")}
        busy={state.busy}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => save(true)}
      >
        <div className="my-3 flex items-baseline gap-2 rounded-xl bg-surface px-4 py-3">
          <span className="text-sm font-semibold text-slate-500">{evaluation.label}</span>
          <span className="ml-auto text-2xl font-extrabold text-primary">{preview.total}</span>
          <span className="text-sm font-semibold text-slate-400">/ {grid.scale}</span>
        </div>
        <p>{t("form.confirmText")}</p>
      </ConfirmDialog>
    </div>
  );
}