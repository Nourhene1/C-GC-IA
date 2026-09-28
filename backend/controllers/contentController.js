import EditionContent from "../models/EditionContent.js";
import Edition from "../models/Edition.js";
import { getCurrentEdition } from "../utils/edition.js";
import { removeFile, publicPath } from "../utils/files.js";

// Récupère (ou crée vide) le contenu de l'édition en cours
async function currentContent() {
  const edition = await getCurrentEdition();
  if (!edition) return { edition: null, content: null };
  let content = await EditionContent.findOne({ edition: edition._id });
  if (!content) content = await EditionContent.create({ edition: edition._id });
  return { edition, content };
}

// ---------------------------------------------------------------------------
// Public — Module 3
// ---------------------------------------------------------------------------

// GET /api/content — règlement, éligibilité, prix, jury, contacts, événements
// + les dates de l'édition pour construire le calendrier (F3.2)
export const getPublicContent = async (req, res) => {
  const edition = await Edition.findOne({ isCurrent: true })
    .select("year title theme dates teamSize")
    .lean();
  if (!edition) return res.status(404).json({ code: "NO_EDITION" });

  const content = await EditionContent.findOne({ edition: edition._id }).lean();
  res.json({ edition, content: content || {}, now: new Date() });
};

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

// GET /api/admin/content
export const getAdminContent = async (req, res) => {
  const { edition, content } = await currentContent();
  if (!edition) return res.status(404).json({ code: "NO_EDITION" });
  res.json({ content, edition: { _id: edition._id, year: edition.year } });
};

// PUT /api/admin/content — chaque onglet envoie seulement sa partie
export const updateContent = async (req, res) => {
  const { edition, content } = await currentContent();
  if (!edition) return res.status(404).json({ code: "NO_EDITION" });

  const { rules, eligibility, prizes, jury, contacts, events } = req.body;
  if (rules?.content) content.rules.content = rules.content;
  if (eligibility) content.eligibility = eligibility;
  if (Array.isArray(prizes)) content.prizes = prizes;
  if (Array.isArray(jury)) {
    // Supprime du disque les photos des membres retirés
    const kept = new Set(jury.map((j) => j.photo).filter(Boolean));
    await Promise.all(content.jury.filter((j) => j.photo && !kept.has(j.photo)).map((j) => removeFile(publicPath(j.photo))));
    content.jury = jury;
  }
  if (Array.isArray(contacts)) content.contacts = contacts;
  if (Array.isArray(events)) content.events = events;

  await content.save();
  res.json({ content });
};

// POST /api/admin/content/rules-pdf — fichier "file"
export const uploadRulesPdf = async (req, res) => {
  if (!req.file) return res.status(400).json({ code: "FILE_REQUIRED" });
  const { content } = await currentContent();
  if (!content) {
    await removeFile(req.file.path);
    return res.status(404).json({ code: "NO_EDITION" });
  }

  await removeFile(publicPath(content.rules.pdf));
  content.rules.pdf = `/uploads/rules/${req.file.filename}`;
  content.rules.pdfName = req.file.originalname;
  await content.save();
  res.json({ rules: content.rules });
};

// DELETE /api/admin/content/rules-pdf
export const deleteRulesPdf = async (req, res) => {
  const { content } = await currentContent();
  if (!content) return res.status(404).json({ code: "NO_EDITION" });
  await removeFile(publicPath(content.rules.pdf));
  content.rules.pdf = null;
  content.rules.pdfName = "";
  await content.save();
  res.json({ rules: content.rules });
};

// POST /api/admin/content/jury-photo — renvoie le chemin de la photo,
// enregistré ensuite avec le reste du jury via PUT /api/admin/content
export const uploadJuryPhoto = async (req, res) => {
  if (!req.file) return res.status(400).json({ code: "FILE_REQUIRED" });
  res.status(201).json({ photo: `/uploads/jury/${req.file.filename}` });
};
