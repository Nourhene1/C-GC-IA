"use client";
import { useCallback, useEffect, useState } from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import {
  Trophy, Eye, Send, CalendarClock, Undo2, Settings2, ArrowUp, ArrowDown, X, Plus, FileSpreadsheet,
  FileText, Award, History, AlertTriangle, Lock, Mail, ExternalLink,
} from "lucide-react";
import Spinner from "@/components/ui/Spinner";
import { Alert, ErrorAlert } from "@/components/ui/Alert";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { btn, card, sectionTitle } from "@/components/ui/styles";
import { smallInput } from "@/components/admin/content/TextPair";
import { fromDateTimeInput } from "@/lib/content";
import {
  getResultsAdmin, saveResultsSettings, publishResults, withdrawResults, resendResults,
  exportResults, downloadTeamCertificates, tieBreakerLabel,
} from "@/lib/results";

const STATUS_STYLE = {
  scheduled: "bg-amber-50 text-amber-700",
  published: "bg-emerald-50 text-emerald-700",
  withdrawn: "bg-slate-100 text-slate-500",
};

// État de la publication officielle (F7.4)
function PublicationCard({ data, onWithdraw, onResend, busy }) {
  const t = useTranslations("results");
  const format = useFormatter();
  const pub = data.publication;
  const date = (d) => format.dateTime(new Date(d), { dateStyle: "long", timeStyle: "short" });

  if (!pub) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-dashed border-slate-300 bg-white p-5">
        <Eye className="mt-0.5 size-5 shrink-0 text-accent" />
        <div>
          <p className="font-bold text-primary">{t("admin.notPublished")}</p>
          <p className="text-sm text-slate-500">{t("admin.previewHint")}</p>
        </div>
      </div>
    );
  }

  const live = new Date(pub.publishAt) <= new Date();
  return (
    <div className={`rounded-2xl p-5 ${live ? "bg-emerald-50" : "bg-amber-50"}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {live ? <Trophy className="mt-0.5 size-6 text-emerald-600" /> : <CalendarClock className="mt-0.5 size-6 text-amber-600" />}
          <div>
            <p className={`font-bold ${live ? "text-emerald-800" : "text-amber-800"}`}>
              {live ? t("admin.publishedOn", { date: date(pub.publishAt), version: pub.version })
                : t("admin.scheduledFor", { date: date(pub.publishAt), version: pub.version })}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600">
              <Lock className="size-3.5" /> {t("admin.lockedHint")}
            </p>
            {pub.notifiedAt && (
              <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600">
                <Mail className="size-3.5" /> {t("admin.notifiedOn", { date: date(pub.notifiedAt) })}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {live && (
            <>
              <a href="/resultats" target="_blank" rel="noopener noreferrer" className={btn.outline}>
                <ExternalLink className="size-4" /> {t("admin.viewPublic")}
              </a>
              <button type="button" className={btn.outline} disabled={busy} onClick={onResend}>
                <Send className="size-4" /> {t("admin.resend")}
              </button>
            </>
          )}
          <button type="button" className={btn.danger} disabled={busy} onClick={onWithdraw}>
            <Undo2 className="size-4" /> {live ? t("admin.withdraw") : t("admin.cancelSchedule")}
          </button>
        </div>
      </div>
    </div>
  );
}

// F7.2 / F7.5 / F7.6 : règles du classement
function SettingsCard({ data, onSaved }) {
  const t = useTranslations("results");
  const locale = useLocale();
  const locked = !!data.publication;
  const [form, setForm] = useState(data.settings);
  const [state, setState] = useState({ busy: false, error: null, saved: false });

  const options = ["lowestGap", "earliestSubmission", ...data.criteria.map((c) => `criterion:${c.id}`)];
  const available = options.filter((o) => !form.tieBreakers.includes(o));
  const setTb = (tieBreakers) => setForm({ ...form, tieBreakers });
  const move = (i, dir) => {
    const next = [...form.tieBreakers];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    setTb(next);
  };

  const submit = async (e) => {
    e.preventDefault();
    setState({ busy: true, error: null, saved: false });
    try {
      await saveResultsSettings({ ...form, podiumSize: Number(form.podiumSize) });
      await onSaved();
      setState({ busy: false, error: null, saved: true });
    } catch (error) {
      setState({ busy: false, error, saved: false });
    }
  };

  return (
    <form onSubmit={submit} className={card}>
      <h2 className={sectionTitle}><Settings2 className="size-5 text-accent" /> {t("admin.rules")}</h2>
      {locked && <Alert type="info" className="mt-4">{t("admin.rulesLocked")}</Alert>}

      <fieldset disabled={locked} className="mt-4 flex flex-col gap-5">
        <div>
          <p className="text-sm font-semibold text-primary">{t("admin.tieBreakTitle")}</p>
          <p className="mb-3 text-xs text-slate-500">{t("admin.tieBreakHint")}</p>
          <ol className="flex flex-col gap-2">
            {form.tieBreakers.map((key, i) => (
              <li key={key} className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm">
                <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">{i + 1}</span>
                <span className="flex-1 text-ink">{tieBreakerLabel(key, data.criteria, t, locale)}</span>
                <button type="button" className={btn.ghost} disabled={i === 0} onClick={() => move(i, -1)} aria-label={t("admin.up")}><ArrowUp className="size-4" /></button>
                <button type="button" className={btn.ghost} disabled={i === form.tieBreakers.length - 1} onClick={() => move(i, 1)} aria-label={t("admin.down")}><ArrowDown className="size-4" /></button>
                <button type="button" className={btn.danger} onClick={() => setTb(form.tieBreakers.filter((k) => k !== key))} aria-label={t("admin.remove")}><X className="size-4" /></button>
              </li>
            ))}
            {form.tieBreakers.length === 0 && <li className="text-sm text-slate-500">{t("admin.noTieBreak")}</li>}
          </ol>
          {available.length > 0 && !locked && (
            <select value="" onChange={(e) => e.target.value && setTb([...form.tieBreakers, e.target.value])}
              className="mt-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-accent"
              aria-label={t("admin.addTieBreak")}>
              <option value="">+ {t("admin.addTieBreak")}</option>
              {available.map((o) => <option key={o} value={o}>{tieBreakerLabel(o, data.criteria, t, locale)}</option>)}
            </select>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block text-sm">
            <span className="mb-1.5 block font-semibold text-primary">{t("admin.podiumSize")}</span>
            <input type="number" min="1" max="10" required className={smallInput}
              value={form.podiumSize} onChange={(e) => setForm({ ...form, podiumSize: e.target.value })} />
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold text-primary sm:pt-6">
            <input type="checkbox" className="size-4 accent-[#E87722]" checked={form.showScores}
              onChange={(e) => setForm({ ...form, showScores: e.target.checked })} />
            {t("admin.showScores")}
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold text-primary sm:pt-6">
            <input type="checkbox" className="size-4 accent-[#E87722]" checked={form.sendCertificates}
              onChange={(e) => setForm({ ...form, sendCertificates: e.target.checked })} />
            {t("admin.sendCertificates")}
          </label>
        </div>
      </fieldset>

      <div className="mt-4 flex flex-col gap-3">
        <ErrorAlert error={state.error} />
        {state.saved && <Alert type="success">{t("admin.rulesSaved")}</Alert>}
      </div>
      {!locked && (
        <button type="submit" disabled={state.busy} className={`${btn.secondary} mt-4`}>{t("admin.saveRules")}</button>
      )}
    </form>
  );
}

// F7.1 / F7.3 : classement (prévisualisation, ou version publiée figée)
function RankingCard({ data }) {
  const t = useTranslations("results");
  const locale = useLocale();
  const [error, setError] = useState(null);
  const pub = data.publication;
  const rows = pub ? pub.rows : [...data.preview.ranked, ...data.preview.unranked];
  const source = pub ? "published" : "preview";

  return (
    <section className={card}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className={sectionTitle}>
            {pub ? <Trophy className="size-5 text-accent" /> : <Eye className="size-5 text-accent" />}
            {pub ? t("admin.officialRanking", { version: pub.version }) : t("admin.previewTitle")}
          </h2>
          <p className="mt-1 text-sm text-slate-500">{pub ? t("admin.frozenHint") : t("admin.previewHint")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={btn.outline} onClick={() => exportResults("xlsx", source, locale).catch(setError)}>
            <FileSpreadsheet className="size-4" /> Excel
          </button>
          <button type="button" className={btn.outline} onClick={() => exportResults("pdf", source, locale).catch(setError)}>
            <FileText className="size-4" /> PDF
          </button>
        </div>
      </div>
      <ErrorAlert error={error} className="mt-4" />

      {rows.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-slate-300 px-6 py-8 text-center text-sm text-slate-500">{t("admin.empty")}</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="py-2 pr-3">{t("rank")}</th>
                <th className="px-3 py-2">{t("team")}</th>
                <th className="px-3 py-2 text-right">{t("score", { scale: data.scale })}</th>
                <th className="px-3 py-2 text-center">{t("admin.evaluations")}</th>
                <th className="px-3 py-2">{t("admin.notes")}</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={String(r.team)} className={`border-b border-slate-50 last:border-0 ${r.rank !== null && r.rank <= data.settings.podiumSize ? "bg-accent-light/40" : ""}`}>
                  <td className="py-3 pr-3 text-base font-extrabold text-primary">{r.rank ?? "—"}</td>
                  <td className="px-3 py-3">
                    <p className="font-semibold text-primary">{r.name}</p>
                    <p className="text-xs text-slate-500">{r.etablissement}</p>
                  </td>
                  <td className="px-3 py-3 text-right font-bold text-primary">{r.score ?? "—"}</td>
                  <td className="px-3 py-3 text-center">{r.evaluations}{r.assigned !== undefined && `/${r.assigned}`}</td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1">
                      {r.tied && <span className="rounded-full bg-accent-light px-2 py-0.5 text-xs font-semibold text-accent">{t("tied")}</span>}
                      {r.decidedBy && (
                        <span className="rounded-full bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-700">
                          {t("admin.decidedBy", { rule: tieBreakerLabel(r.decidedBy, data.criteria, t, locale) })}
                        </span>
                      )}
                      {r.deliberated && <span className="rounded-full bg-violet-50 px-2 py-0.5 text-xs font-semibold text-violet-700">{t("admin.deliberated")}</span>}
                      {r.rank === null && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{t("admin.unranked")}</span>}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <button type="button" className={btn.ghost} title={t("admin.certificatesHint")}
                      onClick={() => downloadTeamCertificates(r.team, locale).catch(setError)}>
                      <Award className="size-4" /> {t("admin.certificates")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// Points à vérifier avant de publier
function Warnings({ warnings }) {
  const t = useTranslations("results");
  const items = ["alerts", "incomplete", "unranked"].filter((k) => warnings[k].length > 0);
  if (items.length === 0) return null;
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
      <p className="flex items-center gap-2 font-bold text-amber-800"><AlertTriangle className="size-5" /> {t("admin.checkTitle")}</p>
      <ul className="mt-2 flex flex-col gap-1 text-sm text-amber-900">
        {items.map((k) => <li key={k}>• {t(`admin.warnings.${k}`, { teams: warnings[k].join(", ") })}</li>)}
      </ul>
    </div>
  );
}

// F7.4 : publication maintenant ou à une date/heure définie
function PublishCard({ data, onPublish }) {
  const t = useTranslations("results");
  const [mode, setMode] = useState("now");
  const [when, setWhen] = useState("");
  const disabled = data.preview.ranked.length === 0 || (mode === "later" && !when);

  return (
    <section className={card}>
      <h2 className={sectionTitle}><Send className="size-5 text-accent" /> {t("admin.publishTitle")}</h2>
      <p className="mt-1 text-sm text-slate-500">{t("admin.publishHint")}</p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex items-center gap-2 text-sm font-semibold text-primary">
          <input type="radio" name="mode" checked={mode === "now"} onChange={() => setMode("now")} className="accent-[#E87722]" />
          {t("admin.now")}
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold text-primary">
          <input type="radio" name="mode" checked={mode === "later"} onChange={() => setMode("later")} className="accent-[#E87722]" />
          {t("admin.later")}
        </label>
        {mode === "later" && (
          <input type="datetime-local" className={`${smallInput} sm:w-60`} value={when} onChange={(e) => setWhen(e.target.value)}
            aria-label={t("admin.later")} />
        )}
      </div>
      <button type="button" disabled={disabled} className={`${btn.primary} mt-5`}
        onClick={() => onPublish(mode === "now" ? null : fromDateTimeInput(when))}>
        <Trophy className="size-4" /> {mode === "now" ? t("admin.publishNow") : t("admin.schedule")}
      </button>
    </section>
  );
}

function HistoryCard({ history }) {
  const t = useTranslations("results");
  const format = useFormatter();
  if (history.length === 0) return null;
  const date = (d) => format.dateTime(new Date(d), { dateStyle: "medium", timeStyle: "short" });
  return (
    <section className={card}>
      <h2 className={sectionTitle}><History className="size-5 text-accent" /> {t("admin.history")}</h2>
      <ul className="mt-4 flex flex-col gap-3">
        {history.map((h) => (
          <li key={h.id} className="flex flex-wrap items-start gap-3 rounded-xl border border-slate-200 p-3 text-sm">
            <span className="font-bold text-primary">v{h.version}</span>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_STYLE[h.status]}`}>{t(`admin.status.${h.status}`)}</span>
            <div className="min-w-0 flex-1 text-slate-600">
              <p>{t("admin.historyLine", { date: date(h.publishAt), name: h.publishedBy })}</p>
              {h.status === "withdrawn" && (
                <p className="text-xs text-slate-500">{t("admin.withdrawnLine", { date: date(h.withdrawnAt), name: h.withdrawnBy, reason: h.withdrawReason })}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

// Module 7 : page admin « Résultats »
export default function ResultsAdmin() {
  const t = useTranslations("results");
  const format = useFormatter();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [busy, setBusy] = useState(false);
  const [dialog, setDialog] = useState(null); // { type: "publish", publishAt } | { type: "withdraw" }
  const [reason, setReason] = useState("");

  const reload = useCallback(() => getResultsAdmin().then(setData).catch(setError), []);
  useEffect(() => { reload(); }, [reload]);

  const run = async (fn, success) => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fn();
      await reload();
      setMessage(typeof success === "function" ? success(res) : success);
      setDialog(null);
      setReason("");
    } catch (err) {
      setError(err);
      setDialog(null);
    } finally {
      setBusy(false);
    }
  };

  if (!data) return error ? <ErrorAlert error={error} /> : <Spinner />;

  const confirmPublish = () => run(() => publishResults(dialog.publishAt),
    dialog.publishAt ? t("admin.scheduledOk") : t("admin.publishedOk"));
  const confirmWithdraw = () => run(() => withdrawResults(reason), t("admin.withdrawnOk"));
  const resend = () => run(() => resendResults(), (res) => t("admin.resentOk", { count: res.sent }));
  const { warnings } = data.preview;
  const hasWarnings = warnings.alerts.length + warnings.incomplete.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-primary">
          <Trophy className="size-6 text-accent" /> {t("admin.title")}
        </h1>
        <p className="mt-1 text-sm text-slate-500">{t("admin.subtitle", { year: data.edition.year })}</p>
      </div>

      <ErrorAlert error={error} />
      {message && <Alert type="success">{message}</Alert>}

      <PublicationCard data={data} busy={busy} onResend={resend} onWithdraw={() => setDialog({ type: "withdraw" })} />
      {!data.publication && <Warnings warnings={warnings} />}
      <RankingCard data={data} />
      {!data.publication && <PublishCard data={data} onPublish={(publishAt) => setDialog({ type: "publish", publishAt })} />}
      <SettingsCard key={JSON.stringify(data.settings) + !!data.publication} data={data} onSaved={reload} />
      <HistoryCard history={data.history} />

      <ConfirmDialog
        open={dialog?.type === "publish"}
        title={dialog?.publishAt ? t("admin.confirmScheduleTitle") : t("admin.confirmPublishTitle")}
        confirmLabel={dialog?.publishAt ? t("admin.schedule") : t("admin.publishNow")}
        cancelLabel={t("admin.cancel")}
        busy={busy}
        onCancel={() => setDialog(null)}
        onConfirm={confirmPublish}
      >
        {dialog?.publishAt && (
          <p className="mb-2 font-semibold text-primary">
            {format.dateTime(new Date(dialog.publishAt), { dateStyle: "full", timeStyle: "short" })}
          </p>
        )}
        <p>{t("admin.confirmPublishText", { count: data.preview.ranked.length })}</p>
        {hasWarnings && <p className="mt-2 font-semibold text-amber-700">{t("admin.confirmWarnings")}</p>}
      </ConfirmDialog>

      <ConfirmDialog
        open={dialog?.type === "withdraw"}
        tone="danger"
        title={t("admin.confirmWithdrawTitle")}
        confirmLabel={t("admin.withdraw")}
        cancelLabel={t("admin.cancel")}
        busy={busy}
        confirmDisabled={!reason.trim()}
        onCancel={() => { setDialog(null); setReason(""); }}
        onConfirm={confirmWithdraw}
      >
        <p>{t("admin.confirmWithdrawText")}</p>
        <input className={`${smallInput} mt-3`} placeholder={t("admin.reason")} aria-label={t("admin.reason")}
          value={reason} onChange={(e) => setReason(e.target.value)} />
      </ConfirmDialog>
    </div>
  );
}
