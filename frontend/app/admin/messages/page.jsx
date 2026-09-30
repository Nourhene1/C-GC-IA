"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations, useFormatter } from "next-intl";
import {
  Inbox,
  Mail,
  MailOpen,
  Trash2,
  Reply,
  AlertTriangle,
  X,
} from "lucide-react";

import RequireAuth from "@/components/auth/RequireAuth";
import AppShell from "@/components/layout/AppShell";
import Spinner from "@/components/ui/Spinner";
import { ErrorAlert } from "@/components/ui/Alert";
import { btn, card } from "@/components/ui/styles";
import { api } from "@/lib/api";
import { DATE_TIME } from "@/lib/format";

// Popup personnalisé de confirmation de suppression
function DeleteMessageModal({ message, onCancel, onConfirm, busy }) {
  const t = useTranslations("adminMessages");
  const tc = useTranslations("common");

  useEffect(() => {
    if (!message) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !busy) {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [message, busy, onCancel]);

  if (!message) return null;

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
        aria-labelledby="delete-message-title"
        aria-describedby="delete-message-description"
        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
      >
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          aria-label={tc("cancel")}
          className="absolute right-4 top-4 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
        >
          <X className="size-5" />
        </button>

        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-red-50">
          <AlertTriangle className="size-6 text-red-600" />
        </div>

        <h2
          id="delete-message-title"
          className="text-xl font-bold text-primary"
        >
          {t("confirmDeleteTitle")}
        </h2>

        <p
          id="delete-message-description"
          className="mt-3 text-sm leading-6 text-slate-500"
        >
          {t("confirmDelete")}
        </p>

        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="truncate text-sm font-semibold text-slate-700">
            {message.subject}
          </p>
          <p className="mt-1 truncate text-xs text-slate-500">
            {message.name} · {message.email}
          </p>
        </div>

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

// F3.4 : messages reçus via le formulaire de contact
function MessagesAdmin() {
  const t = useTranslations("adminMessages");
  const tc = useTranslations("common");
  const format = useFormatter();

  const [onlyUnread, setOnlyUnread] = useState(false);
  const [data, setData] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [error, setError] = useState(null);

  // État du popup de suppression
  const [deletingMessage, setDeletingMessage] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(
    () =>
      api(`/api/admin/messages${onlyUnread ? "?unread=1" : ""}`)
        .then(setData)
        .catch(setError),
    [onlyUnread]
  );

  useEffect(() => {
    load();
  }, [load]);

  const setRead = async (m, read) => {
    try {
      await api(`/api/admin/messages/${m._id}`, {
        method: "PATCH",
        body: { read },
      });

      await load();
    } catch (err) {
      setError(err);
    }
  };

  // Ouvrir un message le marque comme lu
  const toggle = (m) => {
    setOpenId((currentId) =>
      currentId === m._id ? null : m._id
    );

    if (!m.read) {
      setRead(m, true);
    }
  };

  // Ouvrir le popup
  const remove = (m) => {
    setError(null);
    setDeletingMessage(m);
  };

  // Annuler la suppression
  const cancelRemove = useCallback(() => {
    if (!deleting) {
      setDeletingMessage(null);
    }
  }, [deleting]);

  // Confirmer la suppression
  const confirmRemove = async () => {
    if (!deletingMessage || deleting) return;

    setDeleting(true);
    setError(null);

    try {
      await api(`/api/admin/messages/${deletingMessage._id}`, {
        method: "DELETE",
      });

      if (openId === deletingMessage._id) {
        setOpenId(null);
      }

      setDeletingMessage(null);
      await load();
    } catch (err) {
      setError(err);
      setDeletingMessage(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-primary">
          <Inbox className="size-6 text-accent" />
          {t("title")}

          {data?.unread > 0 && (
            <span className="rounded-full bg-accent px-2.5 py-0.5 text-sm text-white">
              {data.unread}
            </span>
          )}
        </h1>

        <label className="flex items-center gap-2 text-sm font-semibold text-primary">
          <input
            type="checkbox"
            checked={onlyUnread}
            onChange={(e) => setOnlyUnread(e.target.checked)}
            className="size-4 accent-accent"
          />
          {t("onlyUnread")}
        </label>
      </div>

      <ErrorAlert error={error} />

      {!data ? (
        <Spinner />
      ) : data.messages.length === 0 ? (
        <p className={`${card} text-center text-slate-500`}>
          {t("empty")}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {data.messages.map((m) => (
            <li
              key={m._id}
              className={`overflow-hidden rounded-2xl bg-white shadow-md shadow-primary/5 ${
                m.read ? "" : "ring-2 ring-accent/40"
              }`}
            >
              <button
                type="button"
                onClick={() => toggle(m)}
                aria-expanded={openId === m._id}
                className="flex w-full items-start gap-3 px-5 py-4 text-left hover:bg-surface"
              >
                {m.read ? (
                  <MailOpen className="mt-0.5 size-5 shrink-0 text-slate-400" />
                ) : (
                  <Mail className="mt-0.5 size-5 shrink-0 text-accent" />
                )}

                <span className="min-w-0 flex-1">
                  <span
                    className={`block truncate ${
                      m.read
                        ? "text-ink"
                        : "font-bold text-primary"
                    }`}
                  >
                    {m.subject}
                  </span>

                  <span className="block truncate text-sm text-slate-500">
                    {m.name} · {m.email}
                  </span>
                </span>

                <time className="shrink-0 text-xs text-slate-500">
                  {format.dateTime(
                    new Date(m.createdAt),
                    DATE_TIME
                  )}
                </time>
              </button>

              {openId === m._id && (
                <div className="border-t border-slate-100 px-5 py-4">
                  <p className="whitespace-pre-line text-sm leading-relaxed text-ink">
                    {m.message}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <a
                      href={`mailto:${m.email}?subject=${encodeURIComponent(
                        `Re: ${m.subject}`
                      )}`}
                      className={btn.primary}
                    >
                      <Reply className="size-4" />
                      {t("reply")}
                    </a>

                    <button
                      onClick={() => setRead(m, false)}
                      className={btn.ghost}
                    >
                      <Mail className="size-4" />
                      {t("markUnread")}
                    </button>

                    <button
                      onClick={() => remove(m)}
                      className={btn.danger}
                    >
                      <Trash2 className="size-4" />
                      {tc("delete")}
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Popup de confirmation */}
      <DeleteMessageModal
        message={deletingMessage}
        onCancel={cancelRemove}
        onConfirm={confirmRemove}
        busy={deleting}
      />
    </div>
  );
}

export default function AdminMessagesPage() {
  return (
    <RequireAuth roles={["admin"]}>
      {(user) => (
        <AppShell user={user}>
          <MessagesAdmin />
        </AppShell>
      )}
    </RequireAuth>
  );
}

