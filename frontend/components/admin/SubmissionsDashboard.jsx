"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Inbox, RefreshCw, Monitor, X, CircleCheck, AlertTriangle, Minus, Eye, Loader2,
} from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import Spinner from "@/components/ui/Spinner";
import { ErrorAlert } from "@/components/ui/Alert";
import { btn, card, sectionTitle } from "@/components/ui/styles";
import useSubmissionError from "@/lib/hooks/useSubmissionError";
import {
  getAdminSubmissions, getAdminTeam, updateSubmissionSettings,
  downloadAdminVersion, DELIVERABLE_KINDS,
} from "@/lib/submission";
import StatusBadge from "@/components/submission/StatusBadge";
import VersionLine from "@/components/submission/VersionLine";
import Countdown from "@/components/submission/Countdown";

function KindCell({ cell, big }) {
  const size = big ? "size-7" : "size-5";
  if (!cell.deposited) return <Minus className={`${size} text-slate-300`} />;
  return cell.late
    ? <AlertTriangle className={`${size} text-amber-500`} />
    : <CircleCheck className={`${size} text-emerald-500`} />;
}

function TeamsTable({ teams, big = false, onSelect }) {
  const t = useTranslations("submission");
  const format = useFormatter();
  const text = big ? "text-xl" : "text-sm";

  return (
    <div className="overflow-x-auto rounded-2xl bg-white shadow-md shadow-primary/5">
      <table className={`w-full ${text}`}>
        <thead>
          <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
            <th className={big ? "px-6 py-4" : "px-4 py-3"}>{t("admin.team")}</th>
            {DELIVERABLE_KINDS.map((k) => (
              <th key={k} className="px-3 py-3 text-center">{t(`kinds.${k}`)}</th>
            ))}
            <th className="px-3 py-3">{t("admin.status")}</th>
            {!big && <th className="px-3 py-3">{t("admin.lastDeposit")}</th>}
            {!big && <th className="px-3 py-3" />}
          </tr>
        </thead>
        <tbody>
          {teams.map((team) => (
            <tr key={team.id} className="border-b border-slate-50 last:border-0">
              <td className={`font-bold text-primary ${big ? "px-6 py-4" : "px-4 py-3"}`}>{team.name}</td>
              {team.items.map((cell) => (
                <td key={cell.kind} className="px-3 py-3">
                  <div className="flex justify-center"><KindCell cell={cell} big={big} /></div>
                </td>
              ))}
              <td className="px-3 py-3"><StatusBadge status={team.status} big={big} /></td>
              {!big && (
                <td className="px-3 py-3 text-xs text-slate-500">
                  {team.lastDepositAt
                    ? format.dateTime(new Date(team.lastDepositAt), { dateStyle: "short", timeStyle: "short" })
                    : t("admin.never")}
                </td>
              )}
              {!big && (
                <td className="px-3 py-3 text-right">
                  <button type="button" className={btn.ghost} onClick={() => onSelect(team)}>
                    <Eye className="size-4" /> {t("actions.details")}
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TeamDetailModal({ team, onClose }) {
  const t = useTranslations("submission");
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getAdminTeam(team.id).then(setDetail).catch(setError);
  }, [team.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-ink">{team.name}</h3>
            {detail?.anonCode && (
              <p className="mt-1 text-xs text-slate-500">{t("admin.anonCode")} : <b>{detail.anonCode}</b></p>
            )}
          </div>
          <button type="button" onClick={onClose} aria-label={t("actions.close")}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-4"><ErrorAlert error={error} /></div>
        {!detail && !error && <Spinner />}

        {detail && (
          <div className="mt-4 flex flex-col gap-4">
            {detail.items.map((item) => (
              <div key={item.kind}>
                <h4 className="mb-2 text-sm font-bold text-primary">{t(`kinds.${item.kind}`)}</h4>
                {!item.current ? (
                  <p className="text-sm text-slate-400">{t("current.none")}</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {[item.current, ...item.history].map((v) => (
                      <li key={v.id} className="rounded-xl border border-slate-200 p-3">
                        <VersionLine version={v} fetcher={() => downloadAdminVersion(team.id, v.id)} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SettingsCard({ settings, onSaved }) {
  const t = useTranslations("submission");
  const errorMessage = useSubmissionError();
  const [tolerance, setTolerance] = useState(String(settings.toleranceMinutes));
  const [anonymize, setAnonymize] = useState(settings.anonymize);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null); // { ok, text }

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      await updateSubmissionSettings({ toleranceMinutes: Number(tolerance), anonymize });
      setMessage({ ok: true, text: t("admin.saved") });
      await onSaved();
    } catch (err) {
      setMessage({ ok: false, text: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={card}>
      <h2 className={sectionTitle}>{t("admin.settings.title")}</h2>
      <form onSubmit={save} className="mt-4 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium text-gray-900 sm:max-w-xs">
          {t("admin.settings.tolerance")}
          <input type="number" min={0} max={240} value={tolerance} disabled={busy}
            onChange={(e) => setTolerance(e.target.value)}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500" />
          <span className="text-xs font-normal text-slate-500">{t("admin.settings.toleranceHint")}</span>
        </label>

        <label className="flex items-start gap-2 text-sm text-gray-800">
          <input type="checkbox" className="mt-1" checked={anonymize} disabled={busy}
            onChange={(e) => setAnonymize(e.target.checked)} />
          <span>
            <b>{t("admin.settings.anonymize")}</b>
            <span className="block text-xs text-slate-500">{t("admin.settings.anonymizeHint")}</span>
          </span>
        </label>

        {message && (
          <p className={`rounded-lg px-4 py-3 text-sm ${message.ok ? "bg-emerald-50 text-emerald-700" : "border border-red-200 bg-red-50 text-red-600"}`}>
            {message.text}
          </p>
        )}

        <div>
          <button type="submit" disabled={busy} className={btn.primary}>
            {busy && <Loader2 className="size-4 animate-spin" />}
            {busy ? t("actions.saving") : t("actions.save")}
          </button>
        </div>
      </form>
    </section>
  );
}

export default function SubmissionsDashboard() {
  const t = useTranslations("submission");
  const format = useFormatter();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [offset, setOffset] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState(null);
  const [projection, setProjection] = useState(false);
  const overlayRef = useRef(null);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const d = await getAdminSubmissions();
      setOffset(new Date(d.now).getTime() - Date.now());
      setData(d);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Rafraîchissement automatique : 15 s en projection, 30 s sinon
  useEffect(() => {
    const id = setInterval(load, projection ? 15_000 : 30_000);
    return () => clearInterval(id);
  }, [load, projection]);

  // Quitter le plein écran (Échap) ferme la projection
  useEffect(() => {
    if (!projection) return;
    const onChange = () => { if (!document.fullscreenElement) setProjection(false); };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, [projection]);

  const enterProjection = () => {
    setProjection(true);
    // L'overlay est monté au prochain rendu
    setTimeout(() => overlayRef.current?.requestFullscreen?.().catch(() => {}), 50);
  };
  const exitProjection = () => {
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    setProjection(false);
  };

  const counts = data?.counts;
  const stats = counts && [
    { key: "total", value: counts.total, cls: "text-primary" },
    { key: "submitted", value: counts.submitted, cls: "text-emerald-600" },
    { key: "late", value: counts.late, cls: "text-amber-600" },
    { key: "not_submitted", value: counts.not_submitted, cls: "text-slate-500" },
  ];

  /* ---------------- Mode projection (datashow) ---------------- */
  if (projection && data) {
    const closed = data.window.state === "closed";
    return (
      <div ref={overlayRef} className="fixed inset-0 z-50 overflow-auto bg-slate-50 p-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-extrabold text-primary">{t("admin.projectionTitle", { year: data.edition.year })}</h1>
              <p className="mt-1 text-lg text-slate-500">
                {closed ? t("window.closed") : t("window.deadline", {
                  date: format.dateTime(new Date(data.window.deadline), { dateStyle: "long", timeStyle: "short" }),
                })}
              </p>
            </div>
            <div className="flex items-center gap-6">
              {!closed && (
                <Countdown target={data.window.closesAt} offset={offset} className="text-5xl font-extrabold text-accent" />
              )}
              <button type="button" onClick={exitProjection} className={btn.outline}>
                <X className="size-4" /> {t("actions.exit")}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.key} className="rounded-2xl bg-white p-6 text-center shadow-md shadow-primary/5">
                <p className={`text-6xl font-extrabold ${s.cls}`}>{s.value}</p>
                <p className="mt-2 text-lg font-semibold text-slate-500">{t(`admin.counts.${s.key}`)}</p>
              </div>
            ))}
          </div>

          <TeamsTable teams={data.teams} big />
        </div>
      </div>
    );
  }

  /* ---------------- Vue normale ---------------- */
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-primary">
            <Inbox className="size-6 text-accent" /> {t("admin.title")}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{t("admin.description")}</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={load} disabled={refreshing} className={btn.outline}>
            <RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} /> {t("actions.refresh")}
          </button>
          <button type="button" onClick={enterProjection} disabled={!data} className={btn.primary}>
            <Monitor className="size-4" /> {t("actions.projection")}
          </button>
        </div>
      </div>

      <ErrorAlert error={error} />

      {!data ? (
        <Spinner />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.key} className={`${card} text-center`}>
                <p className={`text-3xl font-extrabold ${s.cls}`}>{s.value}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">{t(`admin.counts.${s.key}`)}</p>
              </div>
            ))}
          </div>

          <TeamsTable teams={data.teams} onSelect={setSelected} />

          <SettingsCard key={JSON.stringify(data.settings)} settings={data.settings} onSaved={load} />
        </>
      )}

      {selected && <TeamDetailModal team={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}