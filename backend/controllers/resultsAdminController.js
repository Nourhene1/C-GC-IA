import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import mongoose from "mongoose";
import Ranking from "../models/Ranking.js";
import { getCurrentEdition } from "../utils/edition.js";
import { audit } from "../utils/audit.js";
import { buildRanking, snapshotRow, validTieBreakers, BASE_TIE_BREAKERS } from "../utils/ranking.js";
import {
  activePublication, runResultsPublication, notifyResults, certificateEntries,
  localizeEntries, editionTitle,
} from "../utils/results.js";
import { certificatesPdf } from "../utils/certificates.js";

const settingsOf = (edition) => ({
  tieBreakers: edition.results?.tieBreakers ?? BASE_TIE_BREAKERS,
  podiumSize: edition.results?.podiumSize ?? 3,
  showScores: edition.results?.showScores ?? true,
  sendCertificates: edition.results?.sendCertificates ?? true,
});

async function currentEdition(res) {
  const edition = await getCurrentEdition();
  if (!edition) res.status(404).json({ code: "NO_EDITION" });
  return edition;
}

const publicationSummary = (p) => p && ({
  id: p._id, version: p.version, status: p.status, publishAt: p.publishAt,
  notifiedAt: p.notifiedAt, withdrawnAt: p.withdrawnAt, withdrawReason: p.withdrawReason,
  publishedBy: p.publishedBy ? `${p.publishedBy.prenom} ${p.publishedBy.nom}` : "",
  withdrawnBy: p.withdrawnBy ? `${p.withdrawnBy.prenom} ${p.withdrawnBy.nom}` : "",
  settings: p.settings,
});

// GET /api/admin/results — F7.3 : prévisualisation réservée à l'admin + état de la publication
export const getResultsAdmin = async (req, res) => {
  const edition = await currentEdition(res);
  if (!edition) return;

  const [{ grid, ranked, unranked, warnings }, history] = await Promise.all([
    buildRanking(edition),
    Ranking.find({ edition: edition._id }).sort({ version: -1 })
      .select("-rows").populate("publishedBy withdrawnBy", "prenom nom").lean(),
  ]);
  const active = history.find((p) => ["scheduled", "published"].includes(p.status));
  const activeRows = active ? (await Ranking.findById(active._id).select("rows").lean()).rows : null;
  const clean = ({ criteria, lastDepositAt, ...r }) => r;

  res.json({
    edition: { id: edition._id, year: edition.year },
    now: new Date(),
    scale: grid.scale,
    criteria: grid.criteria.map((c) => ({ id: c._id, label: c.label })),
    settings: settingsOf(edition),
    preview: { ranked: ranked.map(clean), unranked: unranked.map(clean), warnings },
    publication: active ? { ...publicationSummary(active), rows: activeRows } : null,
    history: history.map(publicationSummary),
  });
};

// PATCH /api/admin/results/settings — F7.2 / F7.5 / F7.6
export const updateResultsSettings = async (req, res) => {
  const edition = await currentEdition(res);
  if (!edition) return;
  if (await activePublication(edition._id)) return res.status(409).json({ code: "RESULTS_PUBLISHED" });

  const { tieBreakers, podiumSize, showScores, sendCertificates } = req.body;
  const { grid } = await buildRanking(edition);

  if (tieBreakers !== undefined) {
    if (!validTieBreakers(tieBreakers, grid)) return res.status(400).json({ code: "VALIDATION_ERROR" });
    edition.set("results.tieBreakers", tieBreakers);
  }
  if (podiumSize !== undefined) {
    const n = Number(podiumSize);
    if (!Number.isInteger(n) || n < 1 || n > 10) return res.status(400).json({ code: "VALIDATION_ERROR" });
    edition.set("results.podiumSize", n);
  }
  if (showScores !== undefined) edition.set("results.showScores", Boolean(showScores));
  if (sendCertificates !== undefined) edition.set("results.sendCertificates", Boolean(sendCertificates));
  await edition.save();

  await audit(req, "RESULTS_SETTINGS_CHANGED", { meta: settingsOf(edition) });
  res.json({ settings: settingsOf(edition) });
};

// POST /api/admin/results/publish — { publishAt? } : F7.4, maintenant ou à une date/heure définie
export const publishResults = async (req, res) => {
  const edition = await currentEdition(res);
  if (!edition) return;
  if (await activePublication(edition._id)) return res.status(409).json({ code: "RESULTS_ALREADY_PUBLISHED" });

  const publishAt = req.body.publishAt ? new Date(req.body.publishAt) : new Date();
  if (Number.isNaN(publishAt.getTime())) return res.status(400).json({ code: "INVALID_PUBLISH_DATE" });

  const { grid, ranked, unranked } = await buildRanking(edition);
  if (ranked.length === 0) return res.status(400).json({ code: "NO_RANKING" });

  const last = await Ranking.findOne({ edition: edition._id }).sort({ version: -1 }).select("version").lean();
  const settings = settingsOf(edition);
  const pub = await Ranking.create({
    edition: edition._id,
    version: (last?.version ?? 0) + 1,
    status: "scheduled",
    publishAt,
    rows: [...ranked, ...unranked].map(snapshotRow), // classement FIGÉ : il ne bougera plus
    settings: { scale: grid.scale, ...settings },
    publishedBy: req.user._id,
  });

  await audit(req, "RESULTS_PUBLISHED", {
    resource: "ranking", resourceId: pub._id,
    meta: { version: pub.version, publishAt, teams: ranked.length },
  });
  if (publishAt <= new Date()) await runResultsPublication(); // publication immédiate
  res.status(201).json({ id: pub._id, version: pub.version, publishAt });
};

// POST /api/admin/results/withdraw — { reason } : retire la publication (tracé) pour pouvoir corriger
export const withdrawResults = async (req, res) => {
  const edition = await currentEdition(res);
  if (!edition) return;
  const reason = String(req.body.reason || "").trim();
  if (!reason) return res.status(400).json({ code: "REASON_REQUIRED" });

  const pub = await activePublication(edition._id);
  if (!pub) return res.status(404).json({ code: "NOT_FOUND" });

  const wasPublic = pub.publishAt <= new Date();
  pub.status = "withdrawn";
  pub.withdrawnAt = new Date();
  pub.withdrawnBy = req.user._id;
  pub.withdrawReason = reason;
  await pub.save();

  if (wasPublic) {
    edition.winners = []; // le podium des archives sera recopié à la prochaine publication
    await edition.save();
  }
  await audit(req, "RESULTS_WITHDRAWN", { resource: "ranking", resourceId: pub._id, meta: { version: pub.version, reason, wasPublic } });
  res.json({ ok: true });
};

// POST /api/admin/results/notify — renvoie les emails + attestations (publication déjà en ligne)
export const resendResults = async (req, res) => {
  const edition = await currentEdition(res);
  if (!edition) return;
  const pub = await activePublication(edition._id);
  if (!pub || pub.publishAt > new Date()) return res.status(409).json({ code: "RESULTS_NOT_PUBLISHED" });

  const count = await notifyResults(pub, edition);
  pub.notifiedAt = new Date();
  await pub.save();
  await audit(req, "RESULTS_NOTIFIED", { resource: "ranking", resourceId: pub._id, meta: { count } });
  res.json({ sent: count });
};

// Classement à exporter : publication active (?source=published) ou prévisualisation
async function rowsFor(edition, source) {
  if (source === "published") {
    const pub = await activePublication(edition._id);
    if (pub) return { rows: pub.rows, scale: pub.settings.scale, version: pub.version, pub };
  }
  const { grid, ranked, unranked } = await buildRanking(edition);
  return { rows: [...ranked, ...unranked].map(snapshotRow), scale: grid.scale, version: null, pub: null };
}

const EXPORT = {
  fr: { title: "Classement", rank: "Rang", team: "Équipe", school: "Établissement", score: "Note", evals: "Évaluations",
        note: "Remarque", tie: "Ex æquo", delib: "Note délibérée", unranked: "Non classée", preview: "Prévisualisation (non officielle)", version: "Version officielle" },
  en: { title: "Ranking", rank: "Rank", team: "Team", school: "Institution", score: "Score", evals: "Evaluations",
        note: "Note", tie: "Tied", delib: "Deliberated score", unranked: "Unranked", preview: "Preview (not official)", version: "Official version" },
};

// GET /api/admin/results/export?format=xlsx|pdf&source=preview|published&lang=fr|en — F7.7
export const exportResults = async (req, res) => {
  const edition = await currentEdition(res);
  if (!edition) return;
  const lang = req.query.lang === "en" ? "en" : "fr";
  const L = EXPORT[lang];
  const { rows, scale, version } = await rowsFor(edition, req.query.source);

  const headers = [L.rank, L.team, L.school, `${L.score} (/${scale})`, L.evals, L.note];
  const data = rows.map((r) => [
    r.rank ?? "—", r.name, r.etablissement, r.score ?? "", r.evaluations,
    [r.tied && L.tie, r.deliberated && L.delib, r.rank === null && L.unranked].filter(Boolean).join(", "),
  ]);
  const subtitle = version ? `${L.version} ${version}` : L.preview;
  const title = `${L.title} — ${editionTitle(edition, lang)}`;
  await audit(req, "RESULTS_EXPORT", { meta: { format: req.query.format, source: req.query.source ?? "preview" } });

  if (req.query.format === "pdf") {
    const doc = new PDFDocument({ size: "A4", margin: 40 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="classement.pdf"');
    doc.pipe(res);
    doc.fillColor("#173A63").font("Helvetica-Bold").fontSize(16).text(title);
    doc.fillColor("#6B7280").font("Helvetica").fontSize(10).text(subtitle).moveDown(0.8);

    const widths = [40, 150, 170, 70, 85];
    const left = doc.page.margins.left;
    const drawRow = (cells, { header = false, shaded = false } = {}) => {
      doc.font(header ? "Helvetica-Bold" : "Helvetica").fontSize(10);
      const h = Math.max(...cells.slice(0, 5).map((c, i) => doc.heightOfString(String(c ?? ""), { width: widths[i] - 8 }))) + 10;
      if (doc.y + h > doc.page.height - doc.page.margins.bottom) doc.addPage();
      const y = doc.y;
      if (header || shaded) doc.rect(left, y, widths.reduce((a, b) => a + b, 0), h).fill(header ? "#173A63" : "#F5F7FA");
      let x = left;
      cells.slice(0, 5).forEach((c, i) => {
        doc.fillColor(header ? "#FFFFFF" : "#1F2937").text(String(c ?? ""), x + 4, y + 5, { width: widths[i] - 8 });
        x += widths[i];
      });
      doc.x = left;
      doc.y = y + h;
    };
    drawRow(headers, { header: true });
    data.forEach((r, i) => drawRow(r, { shaded: i % 2 === 1 }));
    doc.end();
    return;
  }

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(L.title);
  ws.addRow([title]).font = { bold: true, size: 14, color: { argb: "FF173A63" } };
  ws.addRow([subtitle]).font = { italic: true, color: { argb: "FF6B7280" } };
  ws.addRow([]);
  const head = ws.addRow(headers);
  head.font = { bold: true, color: { argb: "FFFFFFFF" } };
  head.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF173A63" } };
  data.forEach((r) => ws.addRow(r));
  [8, 30, 34, 14, 14, 30].forEach((w, i) => { ws.getColumn(i + 1).width = w; });
  ws.views = [{ state: "frozen", ySplit: 4 }];

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", 'attachment; filename="classement.xlsx"');
  await wb.xlsx.write(res);
  res.end();
};

// GET /api/admin/results/certificates/:teamId?lang=fr|en — attestations d'une équipe (aperçu admin)
export const teamCertificates = async (req, res) => {
  const edition = await currentEdition(res);
  if (!edition) return;
  if (!mongoose.isValidObjectId(req.params.teamId)) return res.status(404).json({ code: "NOT_FOUND" });
  const lang = req.query.lang === "en" ? "en" : "fr";

  // Avant publication : aperçu à partir de la prévisualisation
  const active = await activePublication(edition._id);
  const pub = active ?? {
    _id: "preview", rows: (await rowsFor(edition, "preview")).rows, settings: settingsOf(edition), publishAt: new Date(),
  };
  const entries = await certificateEntries(pub, edition, { teamId: req.params.teamId });
  if (entries.length === 0) return res.status(404).json({ code: "NOT_FOUND" });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", 'attachment; filename="attestations.pdf"');
  certificatesPdf(localizeEntries(entries, lang), { lang, editionTitle: editionTitle(edition, lang), date: pub.publishAt }).pipe(res);
};
