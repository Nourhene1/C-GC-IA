import path from "path";
import Edition from "../models/Edition.js";
import Sponsor from "../models/Sponsor.js";
import { removeFile, publicPath } from "../utils/files.js";
import { withEnglish } from "../utils/autoTranslate.js";
import {
  parseVideoUrl, removeStoredEditionVideo, discardEditionFiles,
} from "../utils/video.js";

// Champs visibles par le public
const PUBLIC_FIELDS = "year title theme dates stats poster subjectSummary winners teamSize video testimonials";

const EMPTY_VIDEO = () => ({ url: "", provider: "", videoId: "" });
const isTrue = (v) => v === true || v === "true";

// ---------------------------------------------------------------------------
// Public
// ---------------------------------------------------------------------------

// GET /api/editions/current
export const getCurrent = async (req, res) => {
  const edition = await Edition.findOne({ isCurrent: true }).lean();
  if (!edition) return res.status(404).json({ code: "NO_EDITION" });
  res.json({ edition, now: new Date() });
};

// GET /api/editions/archives
export const listArchives = async (req, res) => {
  const editions = await Edition.find({ isCurrent: false })
    .sort({ year: -1 })
    .select("year title theme stats poster winners")
    .lean();
  res.json({ editions });
};

// GET /api/editions/:year
export const getArchive = async (req, res) => {
  const edition = await Edition.findOne({ year: Number(req.params.year), isCurrent: false })
    .select(PUBLIC_FIELDS)
    .lean();
  if (!edition) return res.status(404).json({ code: "NOT_FOUND" });

  const sponsors = await Sponsor.find({ edition: edition._id }).select("name logo website tier").lean();
  res.json({ edition, sponsors });
};

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

// GET /api/admin/editions
export const listEditions = async (req, res) => {
  const editions = await Edition.find()
    .sort({ year: -1 })
    .select("year title theme isCurrent dates poster")
    .lean();
  res.json({ editions });
};

// GET /api/admin/editions/:id
export const getEdition = async (req, res) => {
  const edition = await Edition.findById(req.params.id);
  if (!edition) return res.status(404).json({ code: "NOT_FOUND" });
  res.json({ edition });
};

// Traduit un texte bilingue ; un champ vide reste vide
const bilingual = (value, previous) =>
  value?.fr?.trim() ? withEnglish(value, previous) : Promise.resolve({ fr: "", en: "" });

// Garde une vidéo déjà enregistrée, après contrôle de son contenu
function keepVideo(v) {
  if (v?.provider === "file") {
    const name = path.basename(String(v.videoId || ""));
    return name
      ? { url: `/uploads/edition-videos/${name}`, provider: "file", videoId: name }
      : EMPTY_VIDEO();
  }
  if (v?.provider === "youtube" || v?.provider === "vimeo") {
    const parsed = parseVideoUrl(v.url);
    if (parsed?.provider === v.provider) return parsed;
  }
  return EMPTY_VIDEO();
}

// Ordre de priorité : fichier importé > suppression > lien > vidéo existante
function resolveVideo({ file, removeVideo, link, existing }) {
  if (file) {
    return {
      value: { url: `/uploads/edition-videos/${file.filename}`, provider: "file", videoId: file.filename },
    };
  }
  if (removeVideo) return { value: EMPTY_VIDEO() };
  if (String(link || "").trim()) {
    const parsed = parseVideoUrl(link);
    return parsed === null ? { error: "INVALID_VIDEO_URL" } : { value: parsed };
  }
  return { value: keepVideo(existing) };
}

// Noms des fichiers vidéo encore utilisés par l'édition
function referencedFiles(edition) {
  const videos = [edition.video, ...(edition.winners || []).map((w) => w.video)];
  return new Set(videos.filter((v) => v?.provider === "file").map((v) => v.videoId));
}

// Copie les champs du formulaire dans l'édition.
// Renvoie un code d'erreur, ou null si tout est valide.
async function applyBody(edition, body, files) {
  for (const f of ["year", "dates", "teamSize", "stats"]) {
    if (body[f] !== undefined) edition[f] = body[f];
  }

  // L'admin écrit en français, l'anglais est traduit automatiquement
  for (const f of ["title", "theme", "subjectSummary"]) {
    if (body[f] !== undefined) edition[f] = await bilingual(body[f], edition[f]);
  }

  const byName = Object.fromEntries(files.map((f) => [f.fieldname, f]));

  // Vidéo générale de l'édition
  const main = resolveVideo({
    file: byName.video,
    removeVideo: isTrue(body.removeVideo),
    link: body.video,
    existing: edition.video,
  });
  if (main.error) return main.error;
  edition.video = main.value;

  // Équipes gagnantes : l'index de chaque vidéo correspond à la position dans le formulaire
  if (Array.isArray(body.winners)) {
    const winners = [];
    for (const [i, w] of body.winners.entries()) {
      if (!w?.teamName?.trim()) continue;

      const res = resolveVideo({
        file: byName[`winnerVideo_${i}`],
        removeVideo: isTrue(w.removeVideo),
        link: w.videoLink,
        existing: w.video,
      });
      if (res.error) return res.error;

      winners.push({
        rank: Number(w.rank) || i + 1,
        teamName: w.teamName.trim(),
        etablissement: w.etablissement || "",
        video: res.value,
      });
    }
    edition.winners = winners.sort((a, b) => a.rank - b.rank);
  }

  // Témoignages
  if (Array.isArray(body.testimonials)) {
    const list = [];
    for (const [i, item] of body.testimonials.entries()) {
      if (!item?.name?.trim()) continue;
      const previous = edition.testimonials?.[i];
      list.push({
        name: item.name.trim(),
        role: await bilingual(item.role, previous?.role),
        quote: await bilingual(item.quote, previous?.quote),
      });
    }
    edition.testimonials = list;
  }

  return null;
}

// Supprime les fichiers envoyés et renvoie une erreur
async function reject(req, res, status, code) {
  await discardEditionFiles(req.files || []);
  return res.status(status).json({ code });
}

// POST /api/admin/editions
export const createEdition = async (req, res) => {
  const files = req.files || [];

  if (await Edition.exists({ year: Number(req.body.year) })) {
    return reject(req, res, 409, "EDITION_EXISTS");
  }

  const edition = new Edition({ isCurrent: false });
  const error = await applyBody(edition, req.body, files);
  if (error) return reject(req, res, 400, error);

  try {
    await edition.save();
  } catch (err) {
    await discardEditionFiles(files);
    throw err;
  }
  res.status(201).json({ edition });
};

// PUT /api/admin/editions/:id
export const updateEdition = async (req, res) => {
  const files = req.files || [];
  const edition = await Edition.findById(req.params.id);
  if (!edition) return reject(req, res, 404, "NOT_FOUND");

  if (
    req.body.year &&
    Number(req.body.year) !== edition.year &&
    (await Edition.exists({ year: Number(req.body.year) }))
  ) {
    return reject(req, res, 409, "EDITION_EXISTS");
  }

  // Fichiers utilisés avant la modification
  const before = referencedFiles(edition);

  const error = await applyBody(edition, req.body, files);
  if (error) return reject(req, res, 400, error);

  try {
    await edition.save();
  } catch (err) {
    await discardEditionFiles(files);
    throw err;
  }

  // Supprime les fichiers qui ne sont plus référencés
  const after = referencedFiles(edition);
  for (const name of before) {
    if (!after.has(name)) await removeStoredEditionVideo(name);
  }

  res.json({ edition });
};

// PATCH /api/admin/editions/:id/current
export const setCurrent = async (req, res) => {
  const edition = await Edition.findById(req.params.id);
  if (!edition) return res.status(404).json({ code: "NOT_FOUND" });

  await Edition.updateMany({ _id: { $ne: edition._id } }, { isCurrent: false });
  edition.isCurrent = true;
  await edition.save();
  res.json({ edition });
};

// POST /api/admin/editions/:id/poster
export const uploadPoster = async (req, res) => {
  if (!req.file) return res.status(400).json({ code: "FILE_REQUIRED" });
  const edition = await Edition.findById(req.params.id);
  if (!edition) {
    await removeFile(req.file.path);
    return res.status(404).json({ code: "NOT_FOUND" });
  }

  await removeFile(publicPath(edition.poster));
  edition.poster = `/uploads/posters/${req.file.filename}`;
  await edition.save();
  res.json({ poster: edition.poster });
};

// DELETE /api/admin/editions/:id/poster
export const deletePoster = async (req, res) => {
  const edition = await Edition.findById(req.params.id);
  if (!edition) return res.status(404).json({ code: "NOT_FOUND" });
  await removeFile(publicPath(edition.poster));
  edition.poster = null;
  await edition.save();
  res.json({ poster: null });
};