"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Save, Send, CalendarClock, FilePen, BellRing } from "lucide-react";
import BilingualField from "./BilingualField";
import Select from "@/components/ui/Select";
import { ErrorAlert } from "@/components/ui/Alert";
import { btn, card } from "@/components/ui/styles";
import { api } from "@/lib/api";
import { toDateTimeInput, fromDateTimeInput } from "@/lib/content";

const CATEGORIES = ["lancement", "rappel", "resultats", "general"];

// Formulaire d'une annonce (création et modification) — F1.2, F1.4, F1.6
export default function NewsForm({ initial }) {
  const t = useTranslations("adminNews");
  const tn = useTranslations("news");
  const router = useRouter();
  const isEdit = Boolean(initial?._id);

  // Mode de publication de départ, déduit de l'annonce existante
  const initialMode = !initial ? "now"
    : !initial.published ? "draft"
    : new Date(initial.publishAt) > new Date() ? "schedule" : "now";

  const [form, setForm] = useState({
    category: initial?.category || "general",
    title: { fr: initial?.title?.fr || "", en: initial?.title?.en || "" },
    content: { fr: initial?.content?.fr || "", en: initial?.content?.en || "" },
    notifyTeams: initial?.notifyTeams ?? true,
    mode: initialMode,
    publishAt: initialMode === "schedule" ? toDateTimeInput(initial.publishAt) : "",
  });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const set = (key) => (value) => setForm({ ...form, [key]: value });
  const alreadyNotified = Boolean(initial?.notifiedAt);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const body = { ...form, publishAt: fromDateTimeInput(form.publishAt) };
      await api(isEdit ? `/api/admin/news/${initial._id}` : "/api/admin/news", {
        method: isEdit ? "PUT" : "POST",
        body,
      });
      router.push("/admin/news");
    } catch (err) {
      setError(err);
      setBusy(false);
    }
  };

  const MODES = [
    { value: "draft", Icon: FilePen, label: t("modeDraft"), hint: t("modeDraftHint") },
    { value: "now", Icon: Send, label: t("modeNow"), hint: t("modeNowHint") },
    { value: "schedule", Icon: CalendarClock, label: t("modeSchedule"), hint: t("modeScheduleHint") },
  ];

  const submitLabel = form.mode === "draft" ? t("saveDraft") : form.mode === "schedule" ? t("schedule") : t("publish");

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-3">
      <div className={`${card} flex flex-col gap-6 lg:col-span-2`}>
        <ErrorAlert error={error} />
        <Select label={t("category")} value={form.category} onChange={(e) => set("category")(e.target.value)}
          options={CATEGORIES.map((c) => ({ value: c, label: tn(`categories.${c}`) }))} />
        <BilingualField label={t("titleField")} value={form.title} onChange={set("title")} required maxLength={150} />
        <BilingualField label={t("content")} value={form.content} onChange={set("content")} required multiline />
      </div>

      <aside className="flex flex-col gap-6">
        <div className={card}>
          <p className="text-sm font-semibold text-primary">{t("publication")}</p>
          <div className="mt-3 flex flex-col gap-2">
            {MODES.map(({ value, Icon, label, hint }) => (
              <label key={value}
                className={`flex cursor-pointer gap-3 rounded-xl border p-3 transition ${
                  form.mode === value ? "border-accent bg-accent-light/50" : "border-slate-200 hover:border-accent/50"
                }`}>
                <input type="radio" name="mode" value={value} checked={form.mode === value}
                  onChange={() => set("mode")(value)} className="mt-1 accent-accent" />
                <span>
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                    <Icon className="size-4 text-accent" /> {label}
                  </span>
                  <span className="text-xs text-slate-500">{hint}</span>
                </span>
              </label>
            ))}
          </div>

          {form.mode === "schedule" && (
            <label className="mt-4 block">
              <span className="mb-1.5 block text-sm font-semibold text-primary">{t("publishAt")}</span>
              <input type="datetime-local" required value={form.publishAt}
                min={toDateTimeInput(new Date())}
                onChange={(e) => set("publishAt")(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-accent focus:ring-4 focus:ring-accent/15" />
            </label>
          )}

          <label className="mt-5 flex cursor-pointer gap-3 rounded-xl bg-surface p-3">
            <input type="checkbox" checked={form.notifyTeams} disabled={alreadyNotified}
              onChange={(e) => set("notifyTeams")(e.target.checked)} className="mt-1 size-4 accent-accent" />
            <span>
              <span className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                <BellRing className="size-4 text-accent" /> {t("notify")}
              </span>
              <span className="text-xs text-slate-500">{alreadyNotified ? t("alreadyNotified") : t("notifyHint")}</span>
            </span>
          </label>

          <button type="submit" disabled={busy} className={`${btn.primary} mt-6 w-full py-3`}>
            <Save className="size-4" /> {busy ? t("saving") : submitLabel}
          </button>
        </div>
      </aside>
    </form>
  );
}