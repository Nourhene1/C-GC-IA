"use client";
import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { MessageCircleQuestion, Plus, Pencil, Trash2, EyeOff } from "lucide-react";
import RequireAuth from "@/components/auth/RequireAuth";
import AppShell from "@/components/layout/AppShell";
import BilingualField from "@/components/admin/BilingualField";
import Select from "@/components/ui/Select";
import Field from "@/components/ui/Field";
import Spinner from "@/components/ui/Spinner";
import { ErrorAlert } from "@/components/ui/Alert";
import { btn, card } from "@/components/ui/styles";
import { api } from "@/lib/api";
import { pick } from "@/lib/content";

const CATEGORIES = ["inscription", "equipe", "sujet", "depot", "evaluation", "autre"];
const EMPTY = { category: "inscription", question: { fr: "", en: "" }, answer: { fr: "", en: "" }, order: 0, published: true };

function FaqForm({ initial, onCancel, onSaved }) {
  const t = useTranslations("adminFaq");
  const tf = useTranslations("faq");
  const tc = useTranslations("common");
  const [form, setForm] = useState(initial || EMPTY);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api(initial?._id ? `/api/admin/faq/${initial._id}` : "/api/admin/faq", {
        method: initial?._id ? "PUT" : "POST",
        body: form,
      });
      await onSaved();
    } catch (err) {
      setError(err);
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className={`${card} flex flex-col gap-5 border-2 border-accent/30`}>
      <h2 className="font-bold text-primary">{initial?._id ? t("edit") : t("new")}</h2>
      <ErrorAlert error={error} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Select label={t("category")} value={form.category} onChange={(e) => set("category")(e.target.value)}
          options={CATEGORIES.map((c) => ({ value: c, label: tf(`categories.${c}`) }))} />
        <Field label={t("order")} type="number" min={0} value={form.order}
          onChange={(e) => set("order")(e.target.value)} hint={t("orderHint")} />
      </div>
      <BilingualField label={t("question")} value={form.question} onChange={set("question")} required maxLength={300} />
      <BilingualField label={t("answer")} value={form.answer} onChange={set("answer")} required multiline />
      <label className="flex items-center gap-2 text-sm font-semibold text-ink">
        <input type="checkbox" checked={form.published} onChange={(e) => set("published")(e.target.checked)} className="size-4 accent-accent" />
        {t("published")}
      </label>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className={btn.outline}>{tc("cancel")}</button>
        <button type="submit" disabled={busy} className={btn.primary}>{busy ? tc("saving") : tc("save")}</button>
      </div>
    </form>
  );
}

// F3.3 : gestion de la FAQ
function FaqAdmin() {
  const t = useTranslations("adminFaq");
  const tf = useTranslations("faq");
  const tc = useTranslations("common");
  const locale = useLocale();
  const [faqs, setFaqs] = useState(null);
  const [editing, setEditing] = useState(null); // null | "new" | question
  const [error, setError] = useState(null);

  const load = useCallback(() => api("/api/admin/faq").then((d) => setFaqs(d.faqs)).catch(setError), []);
  useEffect(() => {
    load();
  }, [load]);

  const saved = async () => {
    setEditing(null);
    await load();
  };

  const remove = async (f) => {
    if (!window.confirm(t("confirmDelete"))) return;
    try {
      await api(`/api/admin/faq/${f._id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      setError(err);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-primary">
          <MessageCircleQuestion className="size-6 text-accent" /> {t("title")}
        </h1>
        {!editing && <button onClick={() => setEditing("new")} className={btn.primary}><Plus className="size-4" /> {t("new")}</button>}
      </div>

      <ErrorAlert error={error} />
      {editing && (
        <FaqForm key={editing._id || "new"} initial={editing === "new" ? null : editing}
          onCancel={() => setEditing(null)} onSaved={saved} />
      )}

      {!faqs ? <Spinner /> : faqs.length === 0 ? (
        <p className={`${card} text-center text-slate-500`}>{t("empty")}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {faqs.map((f) => (
            <li key={f._id} className="flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-md shadow-primary/5 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full bg-accent-light px-2.5 py-1 font-bold text-accent">{tf(`categories.${f.category}`)}</span>
                  {!f.published && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 font-bold text-slate-600">
                      <EyeOff className="size-3" /> {t("hidden")}
                    </span>
                  )}
                  {!f.question.en && <span className="text-amber-700">{t("missingEnglish")}</span>}
                </div>
                <p className="mt-2 font-semibold text-primary">{pick(f.question, locale)}</p>
                <p className="line-clamp-2 text-sm text-slate-500">{pick(f.answer, locale)}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setEditing(f)} className={btn.ghost}><Pencil className="size-4" /> {tc("edit")}</button>
                <button onClick={() => remove(f)} className={btn.danger} aria-label={tc("delete")} title={tc("delete")}>
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

export default function AdminFaqPage() {
  return (
    <RequireAuth roles={["admin"]}>
      {(user) => <AppShell user={user}><FaqAdmin /></AppShell>}
    </RequireAuth>
  );
}
