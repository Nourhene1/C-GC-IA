import EditionContent from "../models/EditionContent.js";
import Edition from "../models/Edition.js";
import User from "../models/User.js";
import { getCurrentEdition } from "../utils/edition.js";
import { removeFile, publicPath } from "../utils/files.js";
import { withEnglish, withEnglishList } from "../utils/autoTranslate.js";
import {
  checkJuryEmails, linkJuryAccounts, removeUnusedJuryAccounts, sendJuryInvitation, withJuryStatus,
} from "../utils/juryAccounts.js";

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
  // L'email des jurés et leur compte restent privés
  if (content?.jury) content.jury = content.jury.map(({ email, user, ...member }) => member);
  res.json({ edition, content: content || {}, now: new Date() });
};

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

// GET /api/admin/content
export const getAdminContent = async (req, res) => {
  const { edition, content } = await currentContent();
  if (!edition) return res.status(404).json({ code: "NO_EDITION" });
  res.json({ content: await withJuryStatus(content), edition: { _id: edition._id, year: edition.year } });
};

// PUT /api/admin/content — chaque onglet envoie seulement sa partie
export const updateContent = async (req, res) => {
  const { edition, content } = await currentContent();
  if (!edition) return res.status(404).json({ code: "NO_EDITION" });

  const { rules, eligibility, prizes, jury, contacts, events } = req.body;
  const prev = content.toObject();

  // Emails du jury vérifiés avant tout enregistrement
  if (Array.isArray(jury)) {
    const code = await checkJuryEmails(jury);
    if (code) return res.status(400).json({ code });
  }
  let invitations = [];

  // L'admin écrit en français : chaque texte est traduit automatiquement en anglais
  if (rules?.content) content.rules.content = await withEnglish(rules.content, prev.rules?.content);
  if (eligibility) content.eligibility = await withEnglish(eligibility, prev.eligibility);
  if (Array.isArray(prizes)) content.prizes = await withEnglishList(prizes, prev.prizes, ["title", "reward"]);
  if (Array.isArray(jury)) {
    // Supprime du disque les photos des membres retirés
    const kept = new Set(jury.map((j) => j.photo).filter(Boolean));
    await Promise.all(content.jury.filter((j) => j.photo && !kept.has(j.photo)).map((j) => removeFile(publicPath(j.photo))));
    const list = await withEnglishList(jury, prev.jury, ["role"]);
    invitations = await linkJuryAccounts(list, prev.jury); // crée les comptes jury
    content.jury = list;
  }
  if (Array.isArray(contacts)) content.contacts = await withEnglishList(contacts, prev.contacts, ["role"]);
  if (Array.isArray(events)) content.events = await withEnglishList(events, prev.events, ["title", "description"]);

  await content.save();

  if (Array.isArray(jury)) {
    await removeUnusedJuryAccounts(content.jury, prev.jury);
    for (const { user, name } of invitations) await sendJuryInvitation(user, name);
  }
  res.json({ content: await withJuryStatus(content) });
};

// POST /api/admin/content/jury/:id/invite — renvoyer l'invitation d'un juré
export const resendJuryInvite = async (req, res) => {
  const { content } = await currentContent();
  const member = content?.jury.id(req.params.id);
  if (!member?.user) return res.status(404).json({ code: "NOT_FOUND" });

  const user = await User.findById(member.user);
  if (!user) return res.status(404).json({ code: "NOT_FOUND" });
  if (user.isVerified) return res.status(400).json({ code: "ACCOUNT_ALREADY_ACTIVE" });

  await sendJuryInvitation(user, member.name);
  res.json({ ok: true });
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