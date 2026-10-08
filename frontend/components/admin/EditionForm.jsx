"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Save, Plus, Trash2, ImagePlus, CalendarDays, Users, BarChart3, Trophy, Info, Video, Quote,
} from "lucide-react";
import BilingualField from "./BilingualField";
import Field from "@/components/ui/Field";
import { Alert, ErrorAlert } from "@/components/ui/Alert";
import { btn, card, sectionTitle } from "@/components/ui/styles";
import { api, publicFileUrl } from "@/lib/api";
import { toDateTimeInput, fromDateTimeInput } from "@/lib/content";

const DATE_KEYS = ["registrationOpen", "registrationClose", "sessionOpen", "submissionDeadline", "evaluationStart", "evaluationEnd", "resultsDate"];
const OPTIONAL_DATES = ["evaluationStart", "evaluationEnd", "resultsDate"];
const MAX_VIDEO_BYTES = 200 * 1024 * 1024;
const VIDEO_ACCEPT = "video/mp4,video/webm,video/quicktime";
const numberInput =
  "w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-accent focus:ring-4 focus:ring-accent/15";

const EMPTY_WINNER = { rank: 1, teamName: "", etablissement: "", video: null, videoLink: "", removeVideo: false, file: null };
const EMPTY_TESTIMONIAL = { name: "", role: { fr: "", en: "" }, quote: { fr: "", en: "" } };

// Lien d'une vidéo existante (vide si fichier importé ou aucune vidéo)
const linkOf = (video) => (video?.provider && video.provider !== "file" ? video.url : "");

// Transforme l'édition reçue de l'API en valeurs de formulaire
function toForm(e) {
  return {
    year: e?.year ?? new Date().getFullYear() + 1,
    title: { fr: e?.title?.fr || "", en: e?.title?.en || "" },
    theme: { fr: e?.theme?.fr || "", en: e?.theme?.en || "" },
    dates: Object.fromEntries(DATE_KEYS.map((k) => [k, toDateTimeInput(e?.dates?.[k])])),
    teamSize: { min: e?.teamSize?.min ?? 2, max: e?.teamSize?.max ?? 5 },
    stats: {
      teams: e?.stats?.teams ?? 0,
      participants: e?.stats?.participants ?? 0,
      schools: e?.stats?.schools ?? 0,
    },
    subjectSummary: { fr: e?.subjectSummary?.fr || "", en: e?.subjectSummary?.en || "" },
    winners: (e?.winners || []).map((w) => ({
      rank: w.rank,
      teamName: w.teamName || "",
      etablissement: w.etablissement || "",
      video: w.video?.provider ? w.video : null,
      videoLink: linkOf(w.video),
      removeVideo: false,
      file: null,
    })),
    testimonials: (e?.testimonials || []).map((item) => ({
      name: item.name || "",
      role: { fr: item.role?.fr || "", en: item.role?.en || "" },
      quote: { fr: item.quote?.fr || "", en: item.quote?.en || "" },
    })),
  };
}

// Formulaire d'une édition : informations, dates, équipes, chiffres, vidéo, podium, témoignages
export default function EditionForm({ initial }) {
  const t = useTranslations("adminEditions");
  const tcd = useTranslations("countdown");
  const tc = useTranslations("common");
  const tv = useTranslations("adminNews"); // libellés vidéo partagés avec les actualités
  const router = useRouter();
  const posterInput = useRef(null);
  const isEdit = Boolean(initial?._id);

  const existingVideo = initial?.video?.provider ? initial.video : null;

  const [form, setForm] = useState(() => toForm(initial));
  const [poster, setPoster] = useState(initial?.poster || null);

  // Vidéo générale : fichier importé OU lien
  const [videoFile, setVideoFile] = useState(null);
  const [videoLink, setVideoLink] = useState(linkOf(existingVideo));
  const [removedExisting, setRemovedExisting] = useState(false);

  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));
  const setNested = (key, sub, value) => setForm((f) => ({ ...f, [key]: { ...f[key], [sub]: value } }));

  // Gagnants
  const patchWinner = (i, patch) =>
    setForm((f) => ({ ...f, winners: f.winners.map((w, j) => (j === i ? { ...w, ...patch } : w)) }));
  const addWinner = () =>
    setForm((f) => ({
      ...f,
      winners: [...f.winners, { ...EMPTY_WINNER, rank: f.winners.length + 1 }],
    }));
  const removeWinner = (i) => setForm((f) => ({ ...f, winners: f.winners.filter((_, j) => j !== i) }));

  const pickWinnerVideo = (i, e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_VIDEO_BYTES) {
      setError("FILE_TOO_LARGE");
      return;
    }
    setError(null);
    patchWinner(i, { file, videoLink: "", removeVideo: false });
  };

  // Témoignages
  const setTestimonial = (i, patch) =>
    setForm((f) => ({
      ...f,
      testimonials: f.testimonials.map((item, j) => (j === i ? { ...item, ...patch } : item)),
    }));
  const addTestimonial = () =>
    setForm((f) => ({ ...f, testimonials: [...f.testimonials, structuredClone(EMPTY_TESTIMONIAL)] }));
  const removeTestimonial = (i) =>
    setForm((f) => ({ ...f, testimonials: f.testimonials.filter((_, j) => j !== i) }));

  // Vidéo générale
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
    setSaved(false);

    const link = videoLink.trim();
    const removeVideo =
      removedExisting || Boolean(existingVideo && existingVideo.provider !== "file" && !link && !videoFile);

    const payload = {
      ...form,
      year: Number(form.year),
      dates: Object.fromEntries(DATE_KEYS.map((k) => [k, fromDateTimeInput(form.dates[k])])),
      teamSize: { min: Number(form.teamSize.min), max: Number(form.teamSize.max) },
      stats: Object.fromEntries(Object.entries(form.stats).map(([k, v]) => [k, Number(v) || 0])),
      video: link,
      removeVideo,
      // Les fichiers partent à part : on retire l'objet File du JSON
      winners: form.winners.map(({ file, ...w }) => w),
    };

    const data = new FormData();
    data.append("payload", JSON.stringify(payload));
    if (videoFile) data.append("video", videoFile);
    form.winners.forEach((w, i) => {
      if (w.file) data.append(`winnerVideo_${i}`, w.file);
    });

    try {
      const res = await api(isEdit ? `/api/admin/editions/${initial._id}` : "/api/admin/editions", {
        method: isEdit ? "PUT" : "POST",
        body: data,
      });
      if (isEdit) setSaved(true);
      else router.replace(`/admin/editions/${res.edition._id}`); // pour pouvoir ajouter l'affiche
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  const uploadPoster = async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    const data = new FormData();
    data.append("file", file);
    try {
      const res = await api(`/api/admin/editions/${initial._id}/poster`, { method: "POST", body: data });
      setPoster(res.poster);
    } catch (err) {
      setError(err);
    }
  };

  const removePoster = async () => {
    await api(`/api/admin/editions/${initial._id}/poster`, { method: "DELETE" }).catch(setError);
    setPoster(null);
  };

  const showExisting = existingVideo && !removedExisting && !videoFile;

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      {/* ---- Informations générales ---- */}
      <section className={`${card} flex flex-col gap-5`}>
        <h2 className={sectionTitle}><Info className="size-5 text-accent" /> {t("general")}</h2>
        <Field label={t("year")} type="number" min={2000} max={2100} value={form.year}
          onChange={(e) => set("year")(e.target.value)} required className="max-w-40" />
        <BilingualField label={t("titleField")} value={form.title} onChange={set("title")} required />
        <BilingualField label={t("theme")} value={form.theme} onChange={set("theme")} required />
      </section>

      {/* ---- Dates clés ---- */}
      <section className={card}>
        <h2 className={sectionTitle}><CalendarDays className="size-5 text-accent" /> {t("dates")}</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {DATE_KEYS.map((k) => (
            <label key={k} className="block">
              <span className="mb-1.5 block text-sm font-semibold text-primary">
                {tcd(`label.${k}`)}
                {!OPTIONAL_DATES.includes(k) && <span className="text-accent"> *</span>}
              </span>
              <input type="datetime-local" required={!OPTIONAL_DATES.includes(k)} value={form.dates[k]}
                onChange={(e) => setNested("dates", k, e.target.value)} className={numberInput} />
            </label>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ---- Taille des équipes ---- */}
        <section className={card}>
          <h2 className={sectionTitle}><Users className="size-5 text-accent" /> {t("teamSize")}</h2>
          <div className="mt-5 grid grid-cols-2 gap-4">
            <Field label={t("min")} type="number" min={1} value={form.teamSize.min} required
              onChange={(e) => setNested("teamSize", "min", e.target.value)} />
            <Field label={t("max")} type="number" min={1} value={form.teamSize.max} required
              onChange={(e) => setNested("teamSize", "max", e.target.value)} />
          </div>
        </section>

        {/* ---- Chiffres affichés sur l'accueil ---- */}
        <section className={card}>
          <h2 className={sectionTitle}><BarChart3 className="size-5 text-accent" /> {t("stats")}</h2>
          <p className="mt-1 text-xs text-slate-500">{t("statsHint")}</p>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {["teams", "participants", "schools"].map((k) => (
              <Field key={k} label={t(`stat_${k}`)} type="number" min={0} value={form.stats[k]}
                onChange={(e) => setNested("stats", k, e.target.value)} />
            ))}
          </div>
        </section>
      </div>

      {/* ---- Vidéo de l'édition ---- */}
      <section className={`${card} flex flex-col gap-4`}>
        <h2 className={sectionTitle}><Video className="size-5 text-accent" /> {tv("video")}</h2>

        {showExisting && (
          <div className="flex items-center justify-between gap-3 rounded-xl bg-surface p-3 text-sm">
            <span className="min-w-0 truncate text-ink">
              {tv("videoCurrent")} :{" "}
              {existingVideo.provider === "file" ? existingVideo.videoId : existingVideo.url}
            </span>
            <button type="button" onClick={() => setRemovedExisting(true)} className={btn.danger}>
              {tv("videoRemove")}
            </button>
          </div>
        )}

        {videoFile ? (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-accent/40 bg-accent-light/50 p-3 text-sm">
            <span className="min-w-0 truncate font-semibold text-ink">{videoFile.name}</span>
            <button type="button" onClick={() => setVideoFile(null)} className={btn.danger}>
              {tv("videoRemove")}
            </button>
          </div>
        ) : (
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-300 p-6 text-center transition hover:border-accent">
            <Video className="size-6 text-accent" />
            <span className="text-sm font-semibold text-primary">{tv("videoUpload")}</span>
            <span className="text-xs text-slate-500">{tv("videoFileHint")}</span>
            <input type="file" accept={VIDEO_ACCEPT} className="sr-only" onChange={pickVideo} />
          </label>
        )}

        <p className="text-center text-xs text-slate-500">{tv("videoOr")}</p>

        <Field
          label={tv("videoLink")}
          name="videoLink"
          type="url"
          placeholder="https://www.youtube.com/watch?v=…"
          value={videoLink}
          disabled={Boolean(videoFile)}
          onChange={(e) => {
            setVideoLink(e.target.value);
            setVideoFile(null);
            setRemovedExisting(false);
          }}
          hint={tv("videoHint")}
        />
      </section>

      {/* ---- Historique : affiche, sujet, podium, témoignages ---- */}
      <section className={`${card} flex flex-col gap-6`}>
        <div>
          <h2 className={sectionTitle}><Trophy className="size-5 text-accent" /> {t("archive")}</h2>
          <p className="mt-1 text-xs text-slate-500">{t("archiveHint")}</p>
        </div>

        {isEdit ? (
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-40 w-32 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-surface">
              {poster ? (
                // eslint-disable-next-line @next/next/no-img-element -- image servie par l'API
                <img src={publicFileUrl(poster)} alt="" className="size-full object-cover" />
              ) : (
                <ImagePlus className="size-8 text-slate-300" />
              )}
            </div>
            <input ref={posterInput} type="file" accept=".png,.jpg,.jpeg,.webp" className="hidden" onChange={uploadPoster} />
            <div className="flex flex-col items-start gap-2">
              <button type="button" onClick={() => posterInput.current.click()} className={btn.outline}>
                <ImagePlus className="size-4" /> {poster ? t("changePoster") : t("addPoster")}
              </button>
              {poster && (
                <button type="button" onClick={removePoster} className={btn.danger}>
                  <Trash2 className="size-4" /> {t("removePoster")}
                </button>
              )}
              <p className="text-xs text-slate-500">{t("posterHint")}</p>
            </div>
          </div>
        ) : (
          <Alert type="info">{t("posterAfterCreate")}</Alert>
        )}

        <BilingualField label={t("subjectSummary")} value={form.subjectSummary} onChange={set("subjectSummary")} multiline />

        {/* Podium avec vidéo par équipe */}
        <div>
          <p className="mb-1 text-sm font-semibold text-primary">{t("winners")}</p>
          <p className="mb-3 text-xs text-slate-500">{t("winnersHint")}</p>

          <div className="flex flex-col gap-3">
            {form.winners.map((w, i) => {
              const hasVideo = Boolean(w.file || w.videoLink.trim() || (w.video?.provider && !w.removeVideo));
              return (
                <div key={i} className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4">
                  <div className="grid grid-cols-[4rem_1fr_auto] gap-2 sm:grid-cols-[4rem_1fr_1fr_auto]">
                    <input type="number" min={1} value={w.rank} aria-label={t("rank")}
                      onChange={(e) => patchWinner(i, { rank: e.target.value })} className={numberInput} />
                    <input value={w.teamName} placeholder={t("teamName")} aria-label={t("teamName")}
                      onChange={(e) => patchWinner(i, { teamName: e.target.value })} className={numberInput} />
                    <input value={w.etablissement} placeholder={t("etablissement")} aria-label={t("etablissement")}
                      onChange={(e) => patchWinner(i, { etablissement: e.target.value })}
                      className={`${numberInput} col-span-2 row-start-2 sm:col-span-1 sm:row-start-auto`} />
                    <button type="button" onClick={() => removeWinner(i)}
                      className={`${btn.danger} row-start-1 sm:row-start-auto`} aria-label={tc("delete")}>
                      <Trash2 className="size-4" />
                    </button>
                  </div>

                  {/* Vidéo de l'équipe */}
                  <div className="flex flex-col gap-2 rounded-xl bg-surface p-3">
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                      <Video className="size-4 text-accent" /> {t("winnerVideo")}
                    </p>

                    {w.file ? (
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <span className="min-w-0 truncate font-semibold text-ink">{w.file.name}</span>
                        <button type="button" onClick={() => patchWinner(i, { file: null })} className={btn.danger}>
                          {tv("videoRemove")}
                        </button>
                      </div>
                    ) : (
                      <label className="flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm font-semibold text-primary transition hover:border-accent hover:text-accent">
                        <Video className="size-4" /> {t("winnerVideoPick")}
                        <input type="file" accept={VIDEO_ACCEPT} className="sr-only"
                          onChange={(e) => pickWinnerVideo(i, e)} />
                      </label>
                    )}

                    {!w.file && (
                      <input
                        type="url"
                        value={w.videoLink}
                        placeholder="https://www.youtube.com/watch?v=…"
                        aria-label={t("winnerVideoLink")}
                        onChange={(e) => patchWinner(i, { videoLink: e.target.value, removeVideo: false })}
                        className={numberInput}
                      />
                    )}

                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-slate-500">
                        {w.removeVideo ? t("winnerVideoRemoved") : t("winnerVideoHint")}
                      </p>
                      {hasVideo && (
                        <button type="button"
                          onClick={() => patchWinner(i, { file: null, videoLink: "", removeVideo: true })}
                          className={btn.danger}>
                          <Trash2 className="size-4" /> {tv("videoRemove")}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button type="button" onClick={addWinner} className={`${btn.ghost} mt-3`}>
            <Plus className="size-4" /> {t("addWinner")}
          </button>
        </div>

        {/* Témoignages des anciens participants */}
        <div>
          <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-primary">
            <Quote className="size-4 text-accent" /> {t("testimonials")}
          </p>
          <p className="mb-3 text-xs text-slate-500">{t("testimonialsHint")}</p>

          <div className="flex flex-col gap-4">
            {form.testimonials.map((item, i) => (
              <div key={i} className="flex gap-3 rounded-2xl border border-slate-200 p-4">
                <div className="flex min-w-0 flex-1 flex-col gap-3">
                  <Field label={t("testimonialName")} value={item.name} required maxLength={100}
                    onChange={(e) => setTestimonial(i, { name: e.target.value })} />
                  <BilingualField label={t("testimonialRole")} value={item.role}
                    onChange={(role) => setTestimonial(i, { role })} />
                  <BilingualField label={t("testimonialQuote")} value={item.quote} multiline
                    onChange={(quote) => setTestimonial(i, { quote })} />
                </div>
                <button type="button" onClick={() => removeTestimonial(i)} className={btn.danger}
                  aria-label={tc("delete")}>
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>

          <button type="button" onClick={addTestimonial} className={`${btn.outline} mt-3 w-fit`}>
            <Plus className="size-4" /> {t("addTestimonial")}
          </button>
        </div>
      </section>

      <div className="sticky bottom-4 flex flex-col gap-3 rounded-2xl bg-white/95 p-4 shadow-xl ring-1 ring-slate-200 backdrop-blur">
        <ErrorAlert error={error} />
        {saved && <Alert type="success">{t("saved")}</Alert>}
        <button type="submit" disabled={busy} className={`${btn.primary} self-end px-8 py-3`}>
          <Save className="size-4" /> {busy ? tc("saving") : tc("save")}
        </button>
      </div>
    </form>
  );
}