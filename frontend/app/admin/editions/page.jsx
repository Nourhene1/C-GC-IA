"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations, useFormatter } from "next-intl";
import { CalendarRange, Plus, Pencil, Star } from "lucide-react";
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

  const load = useCallback(() => api("/api/admin/editions").then((d) => setEditions(d.editions)).catch(setError), []);
  useEffect(() => {
    load();
  }, [load]);

  // L'édition "en cours" est celle affichée sur l'accueil et utilisée pour les inscriptions
  const makeCurrent = async (e) => {
    if (!window.confirm(t("confirmCurrent", { year: e.year }))) return;
    try {
      await api(`/api/admin/editions/${e._id}/current`, { method: "PATCH" });
      await load();
    } catch (err) {
      setError(err);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-primary">
            <CalendarRange className="size-6 text-accent" /> {t("title")}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{t("subtitle")}</p>
        </div>
        <Link href="/admin/editions/new" className={btn.primary}><Plus className="size-4" /> {t("new")}</Link>
      </div>

      <ErrorAlert error={error} />

      {!editions ? <Spinner /> : (
        <ul className="flex flex-col gap-3">
          {editions.map((e) => (
            <li key={e._id}
              className={`flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-md shadow-primary/5 sm:flex-row sm:items-center ${
                e.isCurrent ? "ring-2 ring-accent" : ""}`}>
              <span className="w-fit rounded-xl bg-primary px-3 py-2 text-lg font-extrabold text-white">{e.year}</span>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 font-bold text-primary">
                  {pick(e.theme, locale)}
                  {e.isCurrent && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-xs font-bold text-white">
                      <Star className="size-3" /> {t("current")}
                    </span>
                  )}
                </p>
                <p className="text-sm text-slate-500">
                  {t("registration")} : {format.dateTime(new Date(e.dates.registrationOpen), { dateStyle: "medium" })}
                  {" → "}
                  {format.dateTime(new Date(e.dates.registrationClose), { dateStyle: "medium" })}
                </p>
              </div>
              <div className="flex gap-1">
                {!e.isCurrent && (
                  <button onClick={() => makeCurrent(e)} className={btn.ghost}><Star className="size-4" /> {t("makeCurrent")}</button>
                )}
                <Link href={`/admin/editions/${e._id}`} className={btn.ghost}><Pencil className="size-4" /> {tc("edit")}</Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function AdminEditionsPage() {
  return (
    <RequireAuth roles={["admin"]}>
      {(user) => <AppShell user={user}><EditionsAdmin /></AppShell>}
    </RequireAuth>
  );
}
