import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import Team, { STATUSES } from "../models/Team.js";
import User from "../models/User.js";
import { getCurrentEdition } from "../utils/edition.js";
import { getChecklist } from "../utils/checklist.js";
import { notifyStatus } from "../utils/notify.js";
import { STATUS_LABELS } from "../utils/emailTemplates.js";

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Filtres communs à la liste et à l'export : ?status=en_attente&q=texte
async function buildFilter(query) {
  const edition = await getCurrentEdition();
  const filter = { edition: edition?._id };

  if (STATUSES.includes(query.status)) filter.status = query.status;

  if (query.q?.trim()) {
    const rx = new RegExp(escapeRegex(query.q.trim()), "i");
    filter.$or = [{ name: rx }, { etablissement: rx }, { "members.email": rx }];
  }
  return { filter, edition };
}

// GET /api/admin/stats
export const getStats = async (req, res) => {
  const edition = await getCurrentEdition();
  const [users, teams] = await Promise.all([
    User.aggregate([{ $group: { _id: "$role", total: { $sum: 1 } } }]),
    Team.aggregate([
      { $match: { edition: edition?._id } },
      { $group: { _id: "$status", total: { $sum: 1 } } },
    ]),
  ]);
  res.json({ users, teams });
};

// GET /api/admin/teams — F2.6 : liste des dossiers
export const listTeams = async (req, res) => {
  const { filter, edition } = await buildFilter(req.query);

  const [teams, counts] = await Promise.all([
    Team.find(filter)
      .select("name etablissement filiere status logo members submittedAt createdAt")
      .sort({ submittedAt: -1, createdAt: -1 })
      .lean(),
    Team.aggregate([
      { $match: { edition: edition?._id } },
      { $group: { _id: "$status", total: { $sum: 1 } } },
    ]),
  ]);

  res.json({
    teams: teams.map(({ members, ...t }) => ({
      ...t,
      membersCount: members.length,
      chef: members.find((m) => m.isChef) || null,
    })),
    counts: Object.fromEntries(counts.map((c) => [c._id, c.total])),
  });
};

// GET /api/admin/teams/:id — détail d'un dossier
export const getTeam = async (req, res) => {
  const team = await Team.findById(req.params.id)
    .populate("edition", "year teamSize requiredDocuments")
    .populate("members.user", "isVerified")
    .populate("history.by", "nom prenom role");
  if (!team) return res.status(404).json({ code: "NOT_FOUND" });

  const obj = team.toObject();
  obj.documents = obj.documents.map(({ fileName, ...doc }) => doc);

  res.json({ team: obj, checklist: getChecklist(team, team.edition) });
};

// PATCH /api/admin/teams/:id/status — F2.6 et F2.7
export const updateStatus = async (req, res) => {
  const { status } = req.body;
  const reason = String(req.body.reason || "").trim();

  if (!["en_attente", "valide", "rejete", "en_revision"].includes(status)) {
    return res.status(400).json({ code: "INVALID_STATUS" });
  }
  // Un motif est obligatoire pour un rejet ou une demande de révision
  if (["rejete", "en_revision"].includes(status) && !reason) {
    return res.status(400).json({ code: "REASON_REQUIRED" });
  }

  const team = await Team.findById(req.params.id);
  if (!team) return res.status(404).json({ code: "NOT_FOUND" });
  if (team.status === "brouillon") {
    return res.status(400).json({ code: "TEAM_NOT_SUBMITTED" });
  }
  if (team.status === status) {
    return res.status(400).json({ code: "SAME_STATUS" });
  }

  team.setStatus(status, req.user._id, reason);
  await team.save();

  await notifyStatus(team);

  res.json({ status: team.status, rejectionReason: team.rejectionReason });
};

// ---------------------------------------------------------------------------
// F2.9 — Export CSV / Excel / PDF
// ---------------------------------------------------------------------------

const HEADERS = {
  fr: ["Équipe", "Établissement", "Filière", "Statut", "Chef d'équipe", "Email du chef",
       "Nb membres", "Membres", "Encadrant", "Soumis le"],
  en: ["Team", "Institution", "Field", "Status", "Team leader", "Leader email",
       "Members", "Member names", "Coach", "Submitted on"],
};

function toRows(teams, lang) {
  const labels = STATUS_LABELS[lang];
  const dateFmt = new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "fr-FR", {
    dateStyle: "short",
    timeZone: "Africa/Tunis",
  });

  return teams.map((t) => {
    const chef = t.members.find((m) => m.isChef);
    return [
      t.name,
      t.etablissement,
      t.filiere,
      labels[t.status],
      chef ? `${chef.prenom} ${chef.nom}` : "",
      chef?.email || "",
      t.members.length,
      t.members.map((m) => `${m.prenom} ${m.nom}`).join(", "),
      t.coach?.nom || "",
      t.submittedAt ? dateFmt.format(t.submittedAt) : "",
    ];
  });
}

function sendCsv(res, headers, rows) {
  const cell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  // ";" et le BOM (﻿) : Excel en français ouvre le fichier avec les accents corrects
  const csv = "﻿" + [headers, ...rows].map((r) => r.map(cell).join(";")).join("\r\n");
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="equipes.csv"');
  res.send(csv);
}

async function sendXlsx(res, headers, rows) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Équipes");
  ws.addRow(headers);
  rows.forEach((r) => ws.addRow(r));

  const head = ws.getRow(1);
  head.font = { bold: true, color: { argb: "FFFFFFFF" } };
  head.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF173A63" } };
  ws.columns.forEach((col, i) => {
    const longest = Math.max(...[headers, ...rows].map((r) => String(r[i] ?? "").length));
    col.width = Math.min(Math.max(longest + 2, 10), 50);
  });
  ws.views = [{ state: "frozen", ySplit: 1 }]; // en-tête figé

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", 'attachment; filename="equipes.xlsx"');
  await wb.xlsx.write(res);
  res.end();
}

function sendPdf(res, headers, rows, title, footer) {
  // Colonnes gardées dans le PDF (le tableau complet est trop large pour une page)
  const keep = [0, 1, 2, 3, 4, 5, 6];
  const widths = [120, 120, 95, 90, 115, 160, 70];
  const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 36 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", 'attachment; filename="equipes.pdf"');
  doc.pipe(res);

  doc.fillColor("#173A63").font("Helvetica-Bold").fontSize(16).text(title);
  doc.moveDown(0.8);

  const left = doc.page.margins.left;
  const bottom = doc.page.height - doc.page.margins.bottom;

  const drawRow = (cells, { header = false, shaded = false } = {}) => {
    doc.font(header ? "Helvetica-Bold" : "Helvetica").fontSize(9);
    const height = Math.max(
      ...keep.map((c, i) => doc.heightOfString(String(cells[c] ?? ""), { width: widths[i] - 8 }))
    ) + 10;

    if (doc.y + height > bottom) doc.addPage();
    const y = doc.y;

    if (header || shaded) {
      doc.rect(left, y, widths.reduce((a, b) => a + b, 0), height)
        .fill(header ? "#173A63" : "#F5F7FA");
    }
    let x = left;
    keep.forEach((c, i) => {
      doc.fillColor(header ? "#FFFFFF" : "#1F2937")
        .text(String(cells[c] ?? ""), x + 4, y + 5, { width: widths[i] - 8 });
      x += widths[i];
    });
    doc.x = left;
    doc.y = y + height;
  };

  drawRow(headers, { header: true });
  rows.forEach((r, i) => drawRow(r, { shaded: i % 2 === 1 }));

  doc.moveDown().font("Helvetica").fontSize(9).fillColor("#6B7280")
    .text(footer, left);
  doc.end();
}

// GET /api/admin/teams/export?format=csv|xlsx|pdf&lang=fr|en&status=…&q=…
export const exportTeams = async (req, res) => {
  const format = req.query.format || "csv";
  const lang = req.query.lang === "en" ? "en" : "fr";
  const { filter, edition } = await buildFilter(req.query);

  const teams = await Team.find(filter).sort({ name: 1 }).lean();
  const headers = HEADERS[lang];
  const rows = toRows(teams, lang);

  if (format === "xlsx") return sendXlsx(res, headers, rows);
  if (format === "pdf") {
    const title = lang === "en"
      ? `Registered teams — ${edition?.year ?? ""}`
      : `Équipes inscrites — ${edition?.year ?? ""}`;
    const date = new Date().toLocaleString(lang === "en" ? "en-GB" : "fr-FR", { timeZone: "Africa/Tunis" });
    const footer = lang === "en" ? `${rows.length} team(s) — ${date}` : `${rows.length} équipe(s) — ${date}`;
    return sendPdf(res, headers, rows, title, footer);
  }
  return sendCsv(res, headers, rows);
};
