import Sponsor, { SPONSOR_TIERS } from "../models/Sponsor.js";
import Edition from "../models/Edition.js";
import { getCurrentEdition } from "../utils/edition.js";
import { removeFile, publicPath } from "../utils/files.js";

// Tri : platine, or, argent, bronze, partenaire, puis ordre choisi par l'admin
const sortSponsors = (list) =>
  list.sort((a, b) =>
    SPONSOR_TIERS.indexOf(a.tier) - SPONSOR_TIERS.indexOf(b.tier) || a.order - b.order
  );

// GET /api/sponsors?year=2025 — public (F1.5). Sans "year" : édition en cours.
export const listSponsors = async (req, res) => {
  const edition = req.query.year
    ? await Edition.findOne({ year: Number(req.query.year) })
    : await getCurrentEdition();
  if (!edition) return res.json({ sponsors: [] });

  const sponsors = await Sponsor.find({ edition: edition._id }).lean();
  res.json({ sponsors: sortSponsors(sponsors) });
};

// Lit les champs du formulaire (envoyé en multipart à cause du logo)
function readBody(body) {
  const { name, website = "", tier = "partenaire", order = 0 } = body;
  if (!name?.trim()) return { error: "FIELDS_REQUIRED" };
  if (!SPONSOR_TIERS.includes(tier)) return { error: "VALIDATION_ERROR" };
  if (website && !/^https?:\/\//i.test(website)) return { error: "INVALID_URL" };
  return { data: { name, website, tier, order: Number(order) || 0 } };
}

// POST /api/admin/sponsors — champs + fichier "file" (logo) facultatif
export const createSponsor = async (req, res) => {
  const { data, error } = readBody(req.body);
  if (error) {
    await removeFile(req.file?.path);
    return res.status(400).json({ code: error });
  }

  const edition = await getCurrentEdition();
  if (!edition) {
    await removeFile(req.file?.path);
    return res.status(400).json({ code: "NO_EDITION" });
  }

  const sponsor = await Sponsor.create({
    ...data,
    edition: edition._id,
    logo: req.file ? `/uploads/sponsors/${req.file.filename}` : null,
  });
  res.status(201).json({ sponsor });
};

// PUT /api/admin/sponsors/:id
export const updateSponsor = async (req, res) => {
  const sponsor = await Sponsor.findById(req.params.id);
  if (!sponsor) {
    await removeFile(req.file?.path);
    return res.status(404).json({ code: "NOT_FOUND" });
  }

  const { data, error } = readBody(req.body);
  if (error) {
    await removeFile(req.file?.path);
    return res.status(400).json({ code: error });
  }

  Object.assign(sponsor, data);
  if (req.file) {
    await removeFile(publicPath(sponsor.logo)); // on remplace l'ancien logo
    sponsor.logo = `/uploads/sponsors/${req.file.filename}`;
  }
  await sponsor.save();
  res.json({ sponsor });
};

// DELETE /api/admin/sponsors/:id
export const deleteSponsor = async (req, res) => {
  const sponsor = await Sponsor.findByIdAndDelete(req.params.id);
  if (!sponsor) return res.status(404).json({ code: "NOT_FOUND" });
  await removeFile(publicPath(sponsor.logo));
  res.json({ ok: true });
};
