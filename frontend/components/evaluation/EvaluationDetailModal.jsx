"use client";
import { useEffect, useState } from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { X, RotateCcw, History } from "lucide-react";
import Spinner from "@/components/ui/Spinner";
import { Alert, ErrorAlert } from "@/components/ui/Alert";
import { btn } from "@/components/ui/styles";
import { smallInput } from "@/components/admin/content/TextPair";
import EvalStatusBadge from "./EvalStatusBadge";
import { getEvaluationDetail, reopenEvaluation, localized } from "@/lib/evaluation";

// F6.9 : détail des notes individuelles, visible uniquement par l'administrateur
export default function EvaluationDetailModal({ evaluationId, onClose, onChanged }) {
  const t = useTranslations("evaluation");
  const locale = useLocale();
  const format = useFormatter();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [reopened, setReopened] = useState(false);

  const load = () => getEvaluationDetail(evaluationId).then(setData).catch(setError);
  useEffect(() => { load(); }, [evaluationId]); // eslint-disable-line react-hooks/exhaustive-deps

  // F6.5 : réouverture tracée (motif obligatoire, l'évaluateur est prévenu)
  const reopen = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await reopenEvaluation(evaluationId, reason);
      setReopened(true);
      setReason("");
      await load();
      onChanged?.();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  const ev = data?.evaluation;
  const values = new Map((ev?.scores ?? []).map((s) => [String(s.item), s.value]));
  const contribution = new Map((ev?.computed.byCriterion ?? []).map((c) => [c.criterion, c]));
  const date = (d) => format.dateTime(new Date(d), { dateStyle: "medium", timeStyle: "short" });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-primary">{ev ? ev.team.name : t("detail.title")}</h3>
            {ev && <p className="mt-0.5 text-sm text-slate-500">{t("detail.by", { name: ev.evaluator.name })}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label={t("close")}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          <ErrorAlert error={error} />
          {reopened && <Alert type="success">{t("detail.reopenedOk")}</Alert>}
        </div>
        {!data && !error && <Spinner />}

        {ev && (
          <div className="mt-4 flex flex-col gap-5">
            <div className="flex flex-wrap items-center gap-3">
              <EvalStatusBadge status={ev.status} />
              <span className="text-2xl font-extrabold text-primary">
                {(ev.status === "submitted" ? ev.total : ev.computed.total) ?? "—"}
                <span className="text-sm font-semibold text-slate-400"> / {data.grid.scale}</span>
              </span>
              {ev.status !== "submitted" && <span className="text-xs text-slate-500">{t("detail.provisional")}</span>}
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <tbody>
                  {data.grid.criteria.map((c) => {
                    const leaves = c.subCriteria.length ? c.subCriteria : [c];
                    const sum = contribution.get(String(c._id));
                    return [
                      <tr key={c._id} className="bg-surface">
                        <td className="px-4 py-2 font-bold text-primary">{localized(c.label, locale)} <span className="font-normal text-slate-500">· {c.weight}%</span></td>
                        <td className="px-4 py-2 text-right font-bold text-primary">{sum?.contribution ?? 0} / {Math.round((c.weight / 100) * data.grid.scale * 100) / 100}</td>
                      </tr>,
                      ...(c.subCriteria.length ? leaves : []).map((l) => (
                        <tr key={l._id} className="border-t border-slate-100">
                          <td className="px-4 py-2 pl-8 text-slate-600">{localized(l.label, locale)}</td>
                          <td className="px-4 py-2 text-right">{values.get(String(l._id)) ?? "—"} / {l.max}</td>
                        </tr>
                      )),
                      ...(!c.subCriteria.length ? [
                        <tr key={`${c._id}-v`} className="border-t border-slate-100">
                          <td className="px-4 py-2 pl-8 text-slate-600">{t("detail.points")}</td>
                          <td className="px-4 py-2 text-right">{values.get(String(c._id)) ?? "—"} / {c.max}</td>
                        </tr>,
                      ] : []),
                    ];
                  })}
                </tbody>
              </table>
            </div>

            <div>
              <h4 className="mb-1 text-sm font-bold text-primary">{t("detail.comment")}</h4>
              <p className="whitespace-pre-line rounded-xl bg-surface px-4 py-3 text-sm text-slate-700">
                {ev.comment || <span className="text-slate-400">{t("detail.noComment")}</span>}
              </p>
            </div>

            {ev.history.length > 0 && (
              <div>
                <h4 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-primary"><History className="size-4" /> {t("detail.history")}</h4>
                <ul className="flex flex-col gap-1.5 text-xs text-slate-600">
                  {ev.history.map((h, i) => (
                    <li key={i}>
                      <b>{date(h.at)}</b> — {t(`detail.action.${h.action}`, { name: h.by, total: h.total ?? "—" })}
                      {h.reason && <> · « {h.reason} »</>}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {ev.status === "submitted" && (
              <form onSubmit={reopen} className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                <p className="text-sm font-bold text-amber-800">{t("detail.reopenTitle")}</p>
                <p className="mt-1 text-xs text-amber-800/80">{t("detail.reopenHint")}</p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <input className={`${smallInput} flex-1`} required placeholder={t("detail.reason")} aria-label={t("detail.reason")}
                    value={reason} onChange={(e) => setReason(e.target.value)} />
                  <button type="submit" disabled={busy || !reason.trim()} className={btn.outline}>
                    <RotateCcw className="size-4" /> {t("detail.reopen")}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
