"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations, useFormatter, useLocale } from "next-intl";
import { Plus, Pencil, Trash2, EyeOff, Eye, ExternalLink, BellRing, Megaphone } from "lucide-react";
import RequireAuth from "@/components/auth/RequireAuth";
import AppShell from "@/components/layout/AppShell";
import Spinner from "@/components/ui/Spinner";
import { ErrorAlert } from "@/components/ui/Alert";
import { CATEGORY_STYLES } from "@/components/public/NewsCard";
import { btn, card } from "@/components/ui/styles";
import { api } from "@/lib/api";
import { pick } from "@/lib/content";
import { DATE_TIME } from "@/lib/format";

const TABS = ["", "published", "scheduled", "draft"];
const STATE_STYLES = {
  published: "bg-green-100 text-green-800",
  scheduled: "bg-blue-100 text-blue-800",
  draft: "bg-slate-100 text-slate-700",
};

function NewsAdmin() {
  const t = useTranslations("adminNews");
  const tn = useTranslations("news");
  const tc = useTranslations("common");
  const format = useFormatter();
  const locale = useLocale();

  const [state, setState] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(
    () => api(`/api/admin/news${state ? `?state=${state}` : ""}`).then(setData).catch(setError),
    [state]
  );
  useEffect(() => {
    load();
  }, [load]);

  // Publier / dépublier / supprimer, puis recharger la liste
  const action = async (fn) => {
    setError(null);
    try {
      await fn();
      await load();
    } catch (err) {
      setError(err);
    }
  };

  const total = data ? Object.values(data.counts).reduce((a, b) => a + b, 0) : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-primary">
          <Megaphone className="size-6 text-accent" /> {t("title")}
        </h1>
        <Link href="/admin/news/new" className={btn.primary}><Plus className="size-4" /> {t("new")}</Link>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((s) => (
          <button key={s || "all"} onClick={() => setState(s)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${
              state === s ? "bg-primary text-white" : "bg-white text-primary hover:bg-accent-light"
            }`}>
            {s ? t(`states.${s}`) : t("all")}{" "}
            <span className={state === s ? "text-accent" : "text-slate-400"}>({s ? data?.counts[s] ?? 0 : total})</span>
          </button>
        ))}
      </div>

      <ErrorAlert error={error} />

      {!data ? <Spinner /> : data.news.length === 0 ? (
        <p className={`${card} text-center text-slate-500`}>{t("empty")}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {data.news.map((n) => (
            <li key={n._id} className="flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-md shadow-primary/5 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className={`rounded-full px-2.5 py-1 font-bold ${STATE_STYLES[n.state]}`}>{t(`states.${n.state}`)}</span>
                  <span className={`rounded-full px-2.5 py-1 font-bold ${CATEGORY_STYLES[n.category]}`}>{tn(`categories.${n.category}`)}</span>
                  {n.publishAt && n.published && (
                    <span className="text-slate-500">{format.dateTime(new Date(n.publishAt), DATE_TIME)}</span>
                  )}
                  {n.notifiedAt && (
                    <span className="inline-flex items-center gap-1 text-green-700" title={t("notified")}>
                      <BellRing className="size-3.5" /> {t("notified")}
                    </span>
                  )}
                </div>
                <p className="mt-2 truncate font-bold text-primary">{pick(n.title, locale)}</p>
                {!n.title.en && <p className="text-xs text-amber-700">{t("missingEnglish")}</p>}
              </div>

              <div className="flex flex-wrap items-center gap-1">
                {n.state === "published" && (
                  <a href={`/news/${n._id}`} target="_blank" rel="noopener noreferrer" className={btn.ghost} title={t("viewOnSite")}>
                    <ExternalLink className="size-4" />
                  </a>
                )}
                <Link href={`/admin/news/${n._id}`} className={btn.ghost}><Pencil className="size-4" /> {tc("edit")}</Link>
                {n.published ? (
                  <button onClick={() => action(() => api(`/api/admin/news/${n._id}/unpublish`, { method: "PATCH" }))} className={btn.ghost}>
                    <EyeOff className="size-4" /> {t("unpublish")}
                  </button>
                ) : (
                  <button onClick={() => action(() => api(`/api/admin/news/${n._id}/publish`, { method: "PATCH" }))} className={btn.ghost}>
                    <Eye className="size-4" /> {t("publish")}
                  </button>
                )}
                <button
                  onClick={() => window.confirm(t("confirmDelete")) && action(() => api(`/api/admin/news/${n._id}`, { method: "DELETE" }))}
                  className={btn.danger} aria-label={tc("delete")} title={tc("delete")}>
                  <Trash2 className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function AdminNewsPage() {
  return (
    <RequireAuth roles={["admin"]}>
      {(user) => <AppShell user={user}><NewsAdmin /></AppShell>}
    </RequireAuth>
  );
}
