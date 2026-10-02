import Edition from "../models/Edition.js";
import { getCurrentEdition } from "../utils/edition.js";
import { audit } from "../utils/audit.js";
import {
  activePublication, publicPublication, certificateEntries, localizeEntries, editionTitle,
} from "../utils/results.js";
import { certificatesPdf } from "../utils/certificates.js";

// GET /api/results?year=2026 — F7.5 / F7.8 : classement officiel (édition en cours ou passée)
export const getPublicResults = async (req, res) => {
  const edition = req.query.year
    ? await Edition.findOne({ year: Number(req.query.year) })
    : await getCurrentEdition();
  if (!edition) return res.status(404).json({ code: "NO_EDITION" });

  const pub = await publicPublication(edition._id);
  if (!pub) {
    // Pas encore publié : on peut annoncer la date si une publication est programmée
    const scheduled = await activePublication(edition._id);
    return res.status(404).json({ code: "RESULTS_NOT_PUBLISHED", publishAt: scheduled?.publishAt ?? null });
  }

  const { showScores, podiumSize, scale } = pub.settings;
  res.json({
    edition: { year: edition.year, title: edition.title },
    publishedAt: pub.publishAt,
    version: pub.version,
    podiumSize, showScores, scale,
    rows: pub.rows
      .filter((r) => r.rank !== null)
      .map((r) => ({
        rank: r.rank, name: r.name, etablissement: r.etablissement, logo: r.logo, tied: r.tied,
        score: showScores ? r.score : undefined,
      })),
  });
};

// GET /api/results/certificate?lang=fr|en — F7.6 : l'attestation de la personne connectée
export const myCertificate = async (req, res) => {
  const edition = await getCurrentEdition();
  if (!edition) return res.status(404).json({ code: "NO_EDITION" });
  const pub = await publicPublication(edition._id);
  if (!pub) return res.status(404).json({ code: "RESULTS_NOT_PUBLISHED" });

  const lang = req.query.lang === "en" ? "en" : req.query.lang === "fr" ? "fr" : req.user.locale === "en" ? "en" : "fr";
  const entries = await certificateEntries(pub, edition, { email: req.user.email });
  if (entries.length === 0) return res.status(404).json({ code: "NO_CERTIFICATE" });

  await audit(req, "CERTIFICATE_DOWNLOAD", { resource: "ranking", resourceId: pub._id });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${lang === "en" ? "certificate" : "attestation"}.pdf"`);
  certificatesPdf(localizeEntries(entries, lang), { lang, editionTitle: editionTitle(edition, lang), date: pub.publishAt }).pipe(res);
};
