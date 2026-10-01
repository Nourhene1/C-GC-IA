"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Upload, Loader2, History, Link2, FileUp, ShieldCheck, Clock, Lock, CircleCheck, X,
} from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import Spinner from "@/components/ui/Spinner";
import { ErrorAlert } from "@/components/ui/Alert";
import { btn, card, sectionTitle } from "@/components/ui/styles";
import useSubmissionError from "@/lib/hooks/useSubmissionError";
import {
  getMySubmission, depositFile, depositLink, downloadMyVersion, formatSize,
} from "@/lib/submission";
import Countdown from "@/components/submission/Countdown";
import StatusBadge from "@/components/submission/StatusBadge";
import VersionLine from "@/components/submission/VersionLine";

function DeliverableCard({ item, rule, canDeposit, onDeposited }) {
  const t = useTranslations("submission");
  const errorMessage = useSubmissionError();
  const { kind, current, history } = item;

  const [mode, setMode] = useState("file"); // file | link
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const inputRef = useRef(null);

  // F5.4 : vérification immédiate, avant l'envoi (le serveur revérifie)
  const validate = (f) => {
    const ext = "." + f.name.split(".").pop().toLowerCase();
    if (!rule.exts.includes(ext)) return t("errors.clientFormat", { allowed: rule.exts.join(", ") });
    if (f.size > rule.maxMb * 1024 * 1024) {
      return t("errors.clientTooLarge", { maxMb: rule.maxMb, size: formatSize(f.size) });
    }
    return null;
  };

  const pick = (e) => {
    const f = e.target.files?.[0] ?? null;
    const problem = f ? validate(f) : null;
    setError(problem);
    setFile(problem ? null : f);
    if (problem && inputRef.current) inputRef.current.value = "";
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = mode === "link" ? await depositLink(kind, url.trim()) : await depositFile(kind, file);
      setFile(null);
      setUrl("");
      if (inputRef.current) inputRef.current.value = "";
      await onDeposited(res.receipt);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const canSend = mode === "link" ? url.trim().length > 0 : !!file;

  return (
    <section className={card}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-base font-bold text-primary">
            {t(`kinds.${kind}`)}
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                rule.required ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-500"
              }`}
            >
              {rule.required ? t("rules.required") : t("rules.optional")}
            </span>
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            {t("rules.formats", { formats: rule.exts.join(", ") })} · {t("rules.maxSize", { maxMb: rule.maxMb })}
            {rule.link && ` · ${t("rules.orLink")}`}
          </p>
        </div>
        {current ? (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
            <CircleCheck className="size-4" /> {t("current.deposited")}
          </span>
        ) : (
          <span className="text-xs font-semibold text-slate-400">{t("current.none")}</span>
        )}
      </div>

      {current && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
          <VersionLine version={current} fetcher={() => downloadMyVersion(current.id)} />
        </div>
      )}

      {canDeposit && (
        <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
          {rule.link && (
            <div className="flex gap-2">
              {[["file", FileUp], ["link", Link2]].map(([m, Icon]) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => { setMode(m); setError(null); }}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                    mode === m
                      ? "border-primary bg-primary text-white"
                      : "border-slate-300 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Icon className="size-3.5" /> {t(`actions.mode_${m}`)}
                </button>
              ))}
            </div>
          )}

          {mode === "link" ? (
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={busy}
              placeholder={t("fields.linkPlaceholder")}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
            />
          ) : (
            <input
              ref={inputRef}
              type="file"
              accept={rule.exts.join(",")}
              onChange={pick}
              disabled={busy}
              className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-slate-200"
            />
          )}

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
          )}

          <div className="flex justify-end">
            <button type="submit" disabled={busy || !canSend} className={`${btn.primary} disabled:cursor-not-allowed disabled:opacity-50`}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
              {busy ? t("actions.sending") : current ? t("actions.replace") : t("actions.send")}
            </button>
          </div>
        </form>
      )}

      {history.length > 0 && (
        <div className="mt-4 border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={() => setShowHistory((v) => !v)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-primary"
          >
            <History className="size-3.5" />
            {showHistory ? t("actions.hideHistory") : t("actions.history", { count: history.length })}
          </button>
          {showHistory && (
            <ul className="mt-3 flex flex-col gap-3">
              {history.map((v) => (
                <li key={v.id} className="rounded-xl border border-slate-200 p-3">
                  <VersionLine version={v} fetcher={() => downloadMyVersion(v.id)} />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

export default function SubmissionSection() {
  const t = useTranslations("submission");
  const format = useFormatter();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [offset, setOffset] = useState(0);
  const [, setTick] = useState(0);

  const load = useCallback(async () => {
    try {
      const d = await getMySubmission();
      setOffset(new Date(d.now).getTime() - Date.now());
      setData(d);
      setError(null);
    } catch (err) {
      setError(err);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const id = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, []);

  if (error && !data) return <ErrorAlert error={error} />;
  if (!data) return <Spinner />;

  // L'état de la fenêtre est recalculé chaque seconde ; le serveur reste l'autorité
  const nowMs = Date.now() + offset;
  const deadline = new Date(data.window.deadline).getTime();
  const closesAt = new Date(data.window.closesAt).getTime();
  const state = nowMs > closesAt ? "closed" : nowMs > deadline ? "grace" : "open";
  const canDeposit = state !== "closed";
  const fmt = (d) => format.dateTime(new Date(d), { dateStyle: "long", timeStyle: "short" });

  const onDeposited = async (r) => {
    setReceipt(r);
    await load();
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Fenêtre de dépôt */}
      <section className={card}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent-light">
              {canDeposit ? <Clock className="size-5 text-primary" /> : <Lock className="size-5 text-primary" />}
            </div>
            <div>
              <h2 className={sectionTitle}>{t(`window.${state}`)}</h2>
              <p className="mt-1 text-sm text-slate-500">
                {t("window.deadline", { date: fmt(data.window.deadline) })}
                {data.window.toleranceMinutes > 0 &&
                  ` · ${t("window.tolerance", { minutes: data.window.toleranceMinutes })}`}
              </p>
              {state === "grace" && (
                <p className="mt-1 text-sm font-semibold text-amber-700">
                  {t("window.graceWarning", { date: fmt(data.window.closesAt) })}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={data.status} />
            {state !== "closed" && (
              <Countdown
                target={state === "open" ? deadline : closesAt}
                offset={offset}
                className="text-lg font-extrabold text-primary"
              />
            )}
          </div>
        </div>
      </section>

      {/* F5.6 : accusé de dépôt */}
      {receipt && (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-emerald-700" />
              <div className="min-w-0">
                <p className="font-bold text-emerald-800">{t("receipt.title")}</p>
                <p className="mt-1 text-sm text-emerald-800">
                  {t(`kinds.${receipt.kind}`)} v{receipt.version} · {receipt.name}
                </p>
                <p className="mt-1 text-sm text-emerald-700">
                  {t("receipt.receivedAt", {
                    date: format.dateTime(new Date(receipt.receivedAt), { dateStyle: "full", timeStyle: "medium" }),
                  })}
                </p>
                {receipt.sha256 && (
                  <p className="mt-1 break-all font-mono text-xs text-emerald-700">SHA-256 : {receipt.sha256}</p>
                )}
                {receipt.late && <p className="mt-2 text-sm font-semibold text-amber-700">{t("receipt.late")}</p>}
                <p className="mt-2 text-xs text-emerald-700">{t("receipt.emailSent")}</p>
              </div>
            </div>
            <button type="button" onClick={() => setReceipt(null)} aria-label={t("actions.close")}
              className="rounded-lg p-1 text-emerald-700 hover:bg-emerald-100">
              <X className="size-5" />
            </button>
          </div>
        </section>
      )}

      <ErrorAlert error={error} />

      {/* Livrables */}
      <div className="grid gap-6 lg:grid-cols-2">
        {data.items.map((item) => (
          <DeliverableCard
            key={item.kind}
            item={item}
            rule={data.rules[item.kind]}
            canDeposit={canDeposit}
            onDeposited={onDeposited}
          />
        ))}
      </div>
    </div>
  );
}