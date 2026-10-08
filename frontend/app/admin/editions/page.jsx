"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations, useFormatter } from "next-intl";
import { CalendarRange, Plus, Pencil, Star, X } from "lucide-react";
import RequireAuth from "@/components/auth/RequireAuth";
import AppShell from "@/components/layout/AppShell";
import Spinner from "@/components/ui/Spinner";
import { ErrorAlert } from "@/components/ui/Alert";
import { btn } from "@/components/ui/styles";
import { api } from "@/lib/api";
import { pick } from "@/lib/content";

function EditionsAdmin() {
  const t = useTranslations("adminEditions");
  const tc = useTranslations("common");
  const locale = useLocale();
  const format = useFormatter();

  const [editions, setEditions] = useState(null);
  const [error, setError] = useState(null);
  const [editionToMakeCurrent, setEditionToMakeCurrent] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(
    () => api("/api/admin/editions").then((d) => setEditions(d.editions)).catch(setError),
    []
  );

  useEffect(() => {
    load();
  }, [load]);

  // Formate une date ; renvoie un tiret si elle est absente ou invalide
  const formatDate = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : format.dateTime(date, { dateStyle: "medium" });
  };

  // L'édition "en cours" est celle affichée sur l'accueil et utilisée pour les inscriptions
  const makeCurrent = async (e) => {
    setBusy(true);
    setError(null);
    try {
      await api(`/api/admin/editions/${e._id}/current`, { method: "PATCH" });
      setEditionToMakeCurrent(null);
      await load();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-primary">
            <CalendarRange className="size-6 text-accent" />
            {t("title")}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{t("subtitle")}</p>
        </div>

        <Link href="/admin/editions/new" className={btn.primary}>
          <Plus className="size-4" />
          {t("new")}
        </Link>
      </div>

      <ErrorAlert error={error} />

      {!editions ? (
        <Spinner />
      ) : editions.length === 0 ? (
        <p className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500 shadow-md shadow-primary/5">
          {t("empty")}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {editions.map((e) => (
            <li
              key={e._id}
              className={`flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-md shadow-primary/5 sm:flex-row sm:items-center ${
                e.isCurrent ? "ring-2 ring-accent" : ""
              }`}
            >
              <span className="w-fit rounded-xl bg-primary px-3 py-2 text-lg font-extrabold text-white">
                {e.year}
              </span>

              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 font-bold text-primary">
                  {pick(e.theme, locale)}
                  {e.isCurrent && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-xs font-bold text-white">
                      <Star className="size-3" />
                      {t("current")}
                    </span>
                  )}
                </p>

                <p className="text-sm text-slate-500">
                  {t("registration")} : {formatDate(e.dates?.registrationOpen)}
                  {" → "}
                  {formatDate(e.dates?.registrationClose)}
                </p>
              </div>

              <div className="flex gap-1">
                {!e.isCurrent && (
                  <button type="button" onClick={() => setEditionToMakeCurrent(e)} className={btn.ghost}>
                    <Star className="size-4" />
                    {t("makeCurrent")}
                  </button>
                )}

                <Link href={`/admin/editions/${e._id}`} className={btn.ghost}>
                  <Pencil className="size-4" />
                  {tc("edit")}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editionToMakeCurrent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="make-current-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 id="make-current-title" className="text-lg font-bold text-ink">
                  {t("makeCurrent")}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {t("confirmCurrent", { year: editionToMakeCurrent.year })}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setEditionToMakeCurrent(null)}
                disabled={busy}
                className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label={tc("cancel")}
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditionToMakeCurrent(null)}
                disabled={busy}
                className={btn.outline}
              >
                {tc("cancel")}
              </button>

              <button
                type="button"
                onClick={() => makeCurrent(editionToMakeCurrent)}
                disabled={busy}
                className={btn.primary}
              >
                <Star className="size-4" />
                {busy ? tc("saving") : t("makeCurrent")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminEditionsPage() {
  return (
    <RequireAuth roles={["admin"]}>
      {(user) => (
        <AppShell user={user}>
          <EditionsAdmin />
        </AppShell>
      )}
    </RequireAuth>
  );
}