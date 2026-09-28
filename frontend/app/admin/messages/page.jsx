"use client";
import { useCallback, useEffect, useState } from "react";
import { useTranslations, useFormatter } from "next-intl";
import { Inbox, Mail, MailOpen, Trash2, Reply } from "lucide-react";
import RequireAuth from "@/components/auth/RequireAuth";
import AppShell from "@/components/layout/AppShell";
import Spinner from "@/components/ui/Spinner";
import { ErrorAlert } from "@/components/ui/Alert";
import { btn, card } from "@/components/ui/styles";
import { api } from "@/lib/api";
import { DATE_TIME } from "@/lib/format";

// F3.4 : messages reçus via le formulaire de contact
function MessagesAdmin() {
  const t = useTranslations("adminMessages");
  const tc = useTranslations("common");
  const format = useFormatter();
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [data, setData] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(
    () => api(`/api/admin/messages${onlyUnread ? "?unread=1" : ""}`).then(setData).catch(setError),
    [onlyUnread]
  );
  useEffect(() => {
    load();
  }, [load]);

  const setRead = async (m, read) => {
    await api(`/api/admin/messages/${m._id}`, { method: "PATCH", body: { read } }).catch(setError);
    await load();
  };

  // Ouvrir un message le marque comme lu
  const toggle = (m) => {
    setOpenId(openId === m._id ? null : m._id);
    if (!m.read) setRead(m, true);
  };

  const remove = async (m) => {
    if (!window.confirm(t("confirmDelete"))) return;
    await api(`/api/admin/messages/${m._id}`, { method: "DELETE" }).catch(setError);
    await load();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-primary">
          <Inbox className="size-6 text-accent" /> {t("title")}
          {data?.unread > 0 && <span className="rounded-full bg-accent px-2.5 py-0.5 text-sm text-white">{data.unread}</span>}
        </h1>
        <label className="flex items-center gap-2 text-sm font-semibold text-primary">
          <input type="checkbox" checked={onlyUnread} onChange={(e) => setOnlyUnread(e.target.checked)} className="size-4 accent-accent" />
          {t("onlyUnread")}
        </label>
      </div>

      <ErrorAlert error={error} />

      {!data ? <Spinner /> : data.messages.length === 0 ? (
        <p className={`${card} text-center text-slate-500`}>{t("empty")}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {data.messages.map((m) => (
            <li key={m._id} className={`overflow-hidden rounded-2xl bg-white shadow-md shadow-primary/5 ${m.read ? "" : "ring-2 ring-accent/40"}`}>
              <button type="button" onClick={() => toggle(m)} aria-expanded={openId === m._id}
                className="flex w-full items-start gap-3 px-5 py-4 text-left hover:bg-surface">
                {m.read ? <MailOpen className="mt-0.5 size-5 shrink-0 text-slate-400" /> : <Mail className="mt-0.5 size-5 shrink-0 text-accent" />}
                <span className="min-w-0 flex-1">
                  <span className={`block truncate ${m.read ? "text-ink" : "font-bold text-primary"}`}>{m.subject}</span>
                  <span className="block truncate text-sm text-slate-500">{m.name} · {m.email}</span>
                </span>
                <time className="shrink-0 text-xs text-slate-500">{format.dateTime(new Date(m.createdAt), DATE_TIME)}</time>
              </button>

              {openId === m._id && (
                <div className="border-t border-slate-100 px-5 py-4">
                  <p className="whitespace-pre-line text-sm leading-relaxed text-ink">{m.message}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <a href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject}`)}`} className={btn.primary}>
                      <Reply className="size-4" /> {t("reply")}
                    </a>
                    <button onClick={() => setRead(m, false)} className={btn.ghost}><Mail className="size-4" /> {t("markUnread")}</button>
                    <button onClick={() => remove(m)} className={btn.danger}><Trash2 className="size-4" /> {tc("delete")}</button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function AdminMessagesPage() {
  return (
    <RequireAuth roles={["admin"]}>
      {(user) => <AppShell user={user}><MessagesAdmin /></AppShell>}
    </RequireAuth>
  );
}
