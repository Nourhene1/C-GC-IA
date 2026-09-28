import Edition from "../models/Edition.js";
import Sponsor from "../models/Sponsor.js";
import { removeFile, publicPath } from "../utils/files.js";

// Champs visibles par le public (pas la configuration interne)
const PUBLIC_FIELDS = "year title theme dates stats poster subjectSummary winners teamSize";

// ---------------------------------------------------------------------------
// Public
// ---------------------------------------------------------------------------

// GET /api/editions/current — F1.1 et F1.3
export const getCurrent = async (req, res) => {
  const edition = await Edition.findOne({ isCurrent: true }).lean();
  if (!edition) return res.status(404).json({ code: "NO_EDITION" });
  // "now" = heure du serveur : le compte à rebours ne dépend pas de l'horloge du visiteur
  res.json({ edition, now: new Date() });
};

// GET /api/editions/archives — historique des sessions précédentes (F1.1)
export const listArchives = async (req, res) => {
  const editions = await Edition.find({ isCurrent: false })
    .sort({ year: -1 })
    .select("year title theme stats poster winners")
    .lean();
  res.json({ editions });
};

// GET /api/editions/:year — détail d'une édition passée, avec ses sponsors
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

// Copie uniquement les champs modifiables depuis le formulaire
function applyBody(edition, body) {
  const fields = ["year", "title", "theme", "dates", "teamSize", "stats", "subjectSummary"];
  for (const f of fields) {
    if (body[f] !== undefined) edition[f] = body[f];
  }
  if (Array.isArray(body.winners)) {
    edition.winners = body.winners
      .filter((w) => w.teamName?.trim())
      .map((w, i) => ({ rank: Number(w.rank) || i + 1, teamName: w.teamName, etablissement: w.etablissement || "" }));
  }
}

// POST /api/admin/editions
export const createEdition = async (req, res) => {
  if (await Edition.exists({ year: Number(req.body.year) })) {
    return res.status(409).json({ code: "EDITION_EXISTS" });
  }
  const edition = new Edition({ isCurrent: false });
  applyBody(edition, req.body);
  await edition.save(); // les validations du modèle (ordre des dates…) s'appliquent
  res.status(201).json({ edition });
};

// PUT /api/admin/editions/:id
export const updateEdition = async (req, res) => {
  const edition = await Edition.findById(req.params.id);
  if (!edition) return res.status(404).json({ code: "NOT_FOUND" });

  if (req.body.year && Number(req.body.year) !== edition.year &&
      await Edition.exists({ year: Number(req.body.year) })) {
    return res.status(409).json({ code: "EDITION_EXISTS" });
  }

  applyBody(edition, req.body);
  await edition.save();
  res.json({ edition });
};

// PATCH /api/admin/editions/:id/current — devient l'édition affichée sur le site
export const setCurrent = async (req, res) => {
  const edition = await Edition.findById(req.params.id);
  if (!edition) return res.status(404).json({ code: "NOT_FOUND" });

  await Edition.updateMany({ _id: { $ne: edition._id } }, { isCurrent: false });
  edition.isCurrent = true;
  await edition.save();
  res.json({ edition });
};

// POST /api/admin/editions/:id/poster — fichier "file"
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
