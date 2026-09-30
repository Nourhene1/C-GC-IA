
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations, useFormatter, useLocale } from "next-intl";
import {
  Plus,
  Pencil,
  Trash2,
  EyeOff,
  Eye,
  ExternalLink,
  BellRing,
  Megaphone,
  AlertTriangle,
  X,
} from "lucide-react";

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

// Popup personnalisé de confirmation de suppression
function DeleteNewsModal({ news, onCancel, onConfirm, busy }) {
  const t = useTranslations("adminNews");
  const tc = useTranslations("common");

  useEffect(() => {
    if (!news) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !busy) {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [news, busy, onCancel]);

  if (!news) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) {
          onCancel();
        }
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-news-title"
        aria-describedby="delete-news-description"
        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Bouton de fermeture */}
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          aria-label={tc("cancel")}
          className="absolute right-4 top-4 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
        >
          <X className="size-5" />
        </button>

        {/* Icône d'avertissement */}
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-red-50">
          <AlertTriangle className="size-6 text-red-600" />
        </div>

        {/* Titre */}
        <h2
          id="delete-news-title"
          className="text-xl font-bold text-primary"
        >
          {t("confirmDeleteTitle")}
        </h2>

        {/* Description */}
        <p
          id="delete-news-description"
          className="mt-3 text-sm leading-6 text-slate-500"
        >
          {t("confirmDelete")}
        </p>

        {/* Actualité concernée */}
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="line-clamp-3 text-sm font-semibold text-slate-700">
            {pick(news.title, "fr") || pick(news.title, "en")}
          </p>
        </div>

        {/* Boutons */}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className={`${btn.outline} justify-center`}
          >
            {tc("cancel")}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? (
              <Spinner />
            ) : (
              <Trash2 className="size-4" />
            )}

            {t("confirmDeleteButton")}
          </button>
        </div>
      </div>
    </div>
  );
}

function NewsAdmin() {
  const t = useTranslations("adminNews");
  const tn = useTranslations("news");
  const tc = useTranslations("common");
  const format = useFormatter();
  const locale = useLocale();

  const [state, setState] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  // État du popup de suppression
  const [deletingNews, setDeletingNews] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(
    () =>
      api(`/api/admin/news${state ? `?state=${state}` : ""}`)
        .then(setData)
        .catch(setError),
    [state]
  );

  useEffect(() => {
    load();
  }, [load]);

  // Publier / dépublier, puis recharger la liste
  const action = async (fn) => {
    setError(null);

    try {
      await fn();
      await load();
    } catch (err) {
      setError(err);
    }
  };

  // Ouvrir le popup
  const remove = (news) => {
    setError(null);
    setDeletingNews(news);
  };

  // Annuler la suppression
  const cancelRemove = useCallback(() => {
    if (!deleting) {
      setDeletingNews(null);
    }
  }, [deleting]);

  // Confirmer la suppression
  const confirmRemove = async () => {
    if (!deletingNews || deleting) return;

    setDeleting(true);
    setError(null);

    try {
      await api(`/api/admin/news/${deletingNews._id}`, {
        method: "DELETE",
      });

      setDeletingNews(null);
      await load();
    } catch (err) {
      setError(err);
      setDeletingNews(null);
    } finally {
      setDeleting(false);
    }
  };

  const total = data
    ? Object.values(data.counts).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* En-tête */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-primary">
          <Megaphone className="size-6 text-accent" />
          {t("title")}
        </h1>

        <Link href="/admin/news/new" className={btn.primary}>
          <Plus className="size-4" />
          {t("new")}
        </Link>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((s) => (
          <button
            key={s || "all"}
            onClick={() => setState(s)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${
              state === s
                ? "bg-primary text-white"
                : "bg-white text-primary hover:bg-accent-light"
            }`}
          >
            {s ? t(`states.${s}`) : t("all")}{" "}
            <span
              className={
                state === s ? "text-accent" : "text-slate-400"
              }
            >
              ({s ? data?.counts[s] ?? 0 : total})
            </span>
          </button>
        ))}
      </div>

      <ErrorAlert error={error} />

      {/* Liste des actualités */}
      {!data ? (
        <Spinner />
      ) : data.news.length === 0 ? (
        <p className={`${card} text-center text-slate-500`}>
          {t("empty")}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {data.news.map((n) => (
            <li
              key={n._id}
              className="flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-md shadow-primary/5 sm:flex-row sm:items-center"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span
                    className={`rounded-full px-2.5 py-1 font-bold ${STATE_STYLES[n.state]}`}
                  >
                    {t(`states.${n.state}`)}
                  </span>

                  <span
                    className={`rounded-full px-2.5 py-1 font-bold ${CATEGORY_STYLES[n.category]}`}
                  >
                    {tn(`categories.${n.category}`)}
                  </span>

                  {n.publishAt && n.published && (
                    <span className="text-slate-500">
                      {format.dateTime(
                        new Date(n.publishAt),
                        DATE_TIME
                      )}
                    </span>
                  )}

                  {n.notifiedAt && (
                    <span
                      className="inline-flex items-center gap-1 text-green-700"
                      title={t("notified")}
                    >
                      <BellRing className="size-3.5" />
                      {t("notified")}
                    </span>
                  )}
                </div>

                <p className="mt-2 truncate font-bold text-primary">
                  {pick(n.title, locale)}
                </p>

                {!n.title.en && (
                  <p className="text-xs text-amber-700">
                    {t("missingEnglish")}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-1">
                {n.state === "published" && (
                  <a
                    href={`/news/${n._id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={btn.ghost}
                    title={t("viewOnSite")}
                  >
                    <ExternalLink className="size-4" />
                  </a>
                )}

                <Link
                  href={`/admin/news/${n._id}`}
                  className={btn.ghost}
                >
                  <Pencil className="size-4" />
                  {tc("edit")}
                </Link>

                {n.published ? (
                  <button
                    onClick={() =>
                      action(() =>
                        api(
                          `/api/admin/news/${n._id}/unpublish`,
                          { method: "PATCH" }
                        )
                      )
                    }
                    className={btn.ghost}
                  >
                    <EyeOff className="size-4" />
                    {t("unpublish")}
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      action(() =>
                        api(
                          `/api/admin/news/${n._id}/publish`,
                          { method: "PATCH" }
                        )
                      )
                    }
                    className={btn.ghost}
                  >
                    <Eye className="size-4" />
                    {t("publish")}
                  </button>
                )}

                {/* Suppression : ouvre le popup */}
                <button
                  onClick={() => remove(n)}
                  className={btn.danger}
                  aria-label={tc("delete")}
                  title={tc("delete")}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Popup de confirmation */}
      <DeleteNewsModal
        news={deletingNews}
        onCancel={cancelRemove}
        onConfirm={confirmRemove}
        busy={deleting}
      />
    </div>
  );
}

export default function AdminNewsPage() {
  return (
    <RequireAuth roles={["admin"]}>
      {(user) => (
        <AppShell user={user}>
          <NewsAdmin />
        </AppShell>
      )}
    </RequireAuth>
  );
}
