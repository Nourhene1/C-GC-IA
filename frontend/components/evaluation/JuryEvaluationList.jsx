"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import { ClipboardCheck, Lock, EyeOff, ArrowRight, CalendarClock } from "lucide-react";
import Spinner from "@/components/ui/Spinner";
import { Alert, ErrorAlert } from "@/components/ui/Alert";
import { card } from "@/components/ui/styles";
import EvalStatusBadge from "./EvalStatusBadge";
import { getMyEvaluations } from "@/lib/evaluation";

// F6.3 : liste des équipes attribuées à l'évaluateur connecté
export default function JuryEvaluationList() {
  const t = useTranslations("evaluation");
  const format = useFormatter();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => { getMyEvaluations().then(setData).catch(setError); }, []);

  // Les évaluations commencent après la clôture des dépôts
  if (error?.code === "SUBMISSIONS_STILL_OPEN") {
    return (
      <div className={`${card} text-center`}>
        <Lock className="mx-auto mb-4 size-10 text-primary/40" />
        <h2 className="text-lg font-bold text-primary">{t("jury.notYetTitle")}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">{t("jury.notYetText")}</p>
      </div>
    );
  }
  if (!data) return error ? <ErrorAlert error={error} /> : <Spinner />;

  const done = data.evaluations.filter((e) => e.status === "submitted").length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-primary">
          <ClipboardCheck className="size-6 text-accent" /> {t("jury.title")}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {t("jury.progress", { done, total: data.evaluations.length })}
        </p>
      </div>

      {data.anonymized && (
        <p className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-600">
          <EyeOff className="size-4 shrink-0" /> {t("jury.anonymized")}
        </p>
      )}
      {data.evaluationEnd && (
        <p className="flex items-center gap-2 text-sm text-slate-600">
          <CalendarClock className="size-4 text-accent" />
          {t(data.closed ? "jury.closedOn" : "jury.until", {
            date: format.dateTime(new Date(data.evaluationEnd), { dateStyle: "long", timeStyle: "short" }),
          })}
        </p>
      )}
      {!data.gridReady && <Alert type="info">{t("jury.gridNotReady")}</Alert>}

      {data.evaluations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 px-6 py-10 text-center text-sm text-slate-500">
          {t("jury.empty")}
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {data.evaluations.map((e) => (
            <li key={e.id}>
              <Link href={`/jury/evaluations/${e.id}`}
                className="group flex items-center justify-between gap-4 rounded-2xl bg-white p-5 shadow-md shadow-primary/5 ring-1 ring-transparent transition hover:ring-accent/40">
                <div className="min-w-0">
                  <p className="truncate text-lg font-bold text-primary">{e.label}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <EvalStatusBadge status={e.status} />
                    {e.status !== "pending" && (
                      <span className="text-sm font-semibold text-slate-600">{e.total} / {data.scale}</span>
                    )}
                  </div>
                </div>
                <ArrowRight className="size-5 shrink-0 text-accent transition group-hover:translate-x-1" />
              </Link>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-slate-500">{t("jury.confidential")}</p>
    </div>
  );
}
