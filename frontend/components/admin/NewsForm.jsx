"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Save, Send, CalendarClock, FilePen, BellRing, Video } from "lucide-react";
import BilingualField from "./BilingualField";
import Field from "@/components/ui/Field";
import Select from "@/components/ui/Select";
import { ErrorAlert } from "@/components/ui/Alert";
import { btn, card } from "@/components/ui/styles";
import { api } from "@/lib/api";
import { toDateTimeInput, fromDateTimeInput } from "@/lib/content";

const CATEGORIES = ["lancement", "rappel", "resultats", "general"];
const MAX_VIDEO_BYTES = 200 * 1024 * 1024;

// Formulaire d'une annonce (création et modification) — F1.2, F1.4, F1.6, vidéo
export default function NewsForm({ initial }) {
  const t = useTranslations("adminNews");
  const tn = useTranslations("news");
  const router = useRouter();
  const isEdit = Boolean(initial?._id);

  // Mode de publication de départ, déduit de l'annonce existante
  const initialMode = !initial ? "now"
    : !initial.published ? "draft"
    : new Date(initial.publishAt) > new Date() ? "schedule" : "now";

  const existingVideo = initial?.video?.provider ? initial.video : null;

  const [form, setForm] = useState({
    category: initial?.category || "general",
    title: { fr: initial?.title?.fr || "", en: initial?.title?.en || "" },
    content: { fr: initial?.content?.fr || "", en: initial?.content?.en || "" },
    notifyTeams: initial?.notifyTeams ?? true,
    mode: initialMode,
    publishAt: initialMode === "schedule" ? toDateTimeInput(initial.publishAt) : "",
  });

  // Vidéo : fichier importé OU lien
  const [videoFile, setVideoFile] = useState(null);
  const [videoLink, setVideoLink] = useState(
    existingVideo && existingVideo.provider !== "file" ? existingVideo.url : ""
  );
  const [removedExisting, setRemovedExisting] = useState(false);

  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const set = (key) => (value) => setForm({ ...form, [key]: value });
  const alreadyNotified = Boolean(initial?.notifiedAt);

  const pickVideo = (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_VIDEO_BYTES) {
      setError("FILE_TOO_LARGE");
      return;
    }
    setError(null);
    setVideoFile(file);
    setVideoLink("");
    setRemovedExisting(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const link = videoLink.trim();
    // Lien existant effacé à la main : on retire la vidéo
    const removeVideo =
      removedExisting ||
      Boolean(existingVideo && existingVideo.provider !== "file" && !link && !videoFile);

    const payload = {
      ...form,
      publishAt: fromDateTimeInput(form.publishAt),
      video: link,
      removeVideo,
    };

    const data = new FormData();
    data.append("payload", JSON.stringify(payload));
    if (videoFile) data.append("video", videoFile);

    try {
      await api(isEdit ? `/api/admin/news/${initial._id}` : "/api/admin/news", {
        method: isEdit ? "PUT" : "POST",
        body: data,
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

  const showExisting = existingVideo && !removedExisting && !videoFile;

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-3">
      <div className={`${card} flex flex-col gap-6 lg:col-span-2`}>
        <ErrorAlert error={error} />

        <Select label={t("category")} value={form.category} onChange={(e) => set("category")(e.target.value)}
          options={CATEGORIES.map((c) => ({ value: c, label: tn(`categories.${c}`) }))} />
        <BilingualField label={t("titleField")} value={form.title} onChange={set("title")} required maxLength={150} />
        <BilingualField label={t("content")} value={form.content} onChange={set("content")} required multiline />

        {/* ----- Vidéo ----- */}
        <div className="flex flex-col gap-3">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-primary">
            <Video className="size-4 text-accent" /> {t("video")}
          </p>

          {showExisting && (
            <div className="flex items-center justify-between gap-3 rounded-xl bg-surface p-3 text-sm">
              <span className="min-w-0 truncate text-ink">
                {t("videoCurrent")} :{" "}
                {existingVideo.provider === "file" ? existingVideo.videoId : existingVideo.url}
              </span>
              <button type="button" onClick={() => setRemovedExisting(true)} className={btn.danger}>
                {t("videoRemove")}
              </button>
            </div>
          )}

          {videoFile ? (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-accent/40 bg-accent-light/50 p-3 text-sm">
              <span className="min-w-0 truncate font-semibold text-ink">{videoFile.name}</span>
              <button type="button" onClick={() => setVideoFile(null)} className={btn.danger}>
                {t("videoRemove")}
              </button>
            </div>
          ) : (
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-300 p-6 text-center transition hover:border-accent">
              <Video className="size-6 text-accent" />
              <span className="text-sm font-semibold text-primary">{t("videoUpload")}</span>
              <span className="text-xs text-slate-500">{t("videoFileHint")}</span>
              <input
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                className="sr-only"
                onChange={pickVideo}
              />
            </label>
          )}

          <p className="text-center text-xs text-slate-500">{t("videoOr")}</p>

          <Field
            label={t("videoLink")}
            name="videoLink"
            type="url"
            placeholder="https://www.youtube.com/watch?v=…"
            value={videoLink}
            disabled={Boolean(videoFile)}
            onChange={(e) => {
              setVideoLink(e.target.value);
              setVideoFile(null);
            }}
            hint={t("videoHint")}
          />
        </div>
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