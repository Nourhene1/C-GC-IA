import mongoose from "mongoose";
import ExcelJS from "exceljs";
import Evaluation from "../models/Evaluation.js";
import Deliberation from "../models/Deliberation.js";
import Notification from "../models/Notification.js";
import Team from "../models/Team.js";
import User from "../models/User.js";
import { getCurrentEdition } from "../utils/edition.js";
import { withEnglish } from "../utils/autoTranslate.js";
import { audit } from "../utils/audit.js";
import { sendMailSafe } from "../utils/mailer.js";
import { resultsLocked } from "../utils/results.js";
import { reopenedMail } from "../utils/evaluationEmails.js";
import {
  validateGrid, computeTotal, teamSummary, balancedAssignment, gridItems,
} from "../utils/grading.js";
import {
  getGrid, isGridLocked, evaluableSubmissions, notifyAssignments,
} from "../utils/evaluations.js";

const fullName = (u) => (u ? `${u.prenom} ${u.nom}` : "");

async function currentEdition(res) {
  const edition = await getCurrentEdition();
  if (!edition) res.status(404).json({ code: "NO_EDITION" });
  return edition;
}

// F7.4 : une fois les résultats publiés (ou programmés), plus aucune note ne peut changer.
// Pour corriger, l'admin doit d'abord retirer la publication (avec un motif, tracé).
async function editableEdition(res) {
  const edition = await currentEdition(res);
  if (!edition) return null;
  if (await resultsLocked(edition)) {
    res.status(409).json({ code: "RESULTS_PUBLISHED" });
    return null;
  }
  return edition;
}

// ---------------------------------------------------------------------------
// F6.1 — Grille d'évaluation
// ---------------------------------------------------------------------------

// GET /api/admin/evaluations/grid
export const getAdminGrid = async (req, res) => {
  const edition = await currentEdition(res);
  if (!edition) return;
  const grid = await getGrid(edition);
  res.json({ grid, locked: await isGridLocked(edition) });
};

// Traduit les libellés en anglais en gardant les traductions déjà faites (comparaison par _id)
async function translateCriteria(criteria, previous = []) {
  const prevById = new Map(previous.map((c) => [String(c._id), c]));
  const result = [];
  for (const c of criteria) {
    const prev = (c._id && prevById.get(String(c._id))) || {};
    const prevSubs = new Map((prev.subCriteria ?? []).map((s) => [String(s._id), s]));
    const subCriteria = [];
    for (const s of c.subCriteria ?? []) {
      const ps = (s._id && prevSubs.get(String(s._id))) || {};
      subCriteria.push({
        ...(mongoose.isValidObjectId(s._id) ? { _id: s._id } : {}),
        label: await withEnglish(s.label, ps.label),
        description: await withEnglish(s.description, ps.description),
        max: Number(s.max),
      });
    }
    result.push({
      ...(mongoose.isValidObjectId(c._id) ? { _id: c._id } : {}),
      label: await withEnglish(c.label, prev.label),
      description: await withEnglish(c.description, prev.description),
      weight: Number(c.weight),
      max: Number(c.max) || 10,
      subCriteria,
    });
  }
  return result;
}

// PUT /api/admin/evaluations/grid — { scale, criteria: [{ label, description, weight, max, subCriteria }] }
export const updateGrid = async (req, res) => {
  const edition = await editableEdition(res);
  if (!edition) return;
  if (await isGridLocked(edition)) return res.status(409).json({ code: "GRID_LOCKED" });

  const code = validateGrid(req.body);
  if (code) return res.status(400).json({ code });

  const grid = await getGrid(edition);
  const previous = grid.toObject().criteria;
  grid.scale = Number(req.body.scale);
  grid.criteria = await translateCriteria(req.body.criteria, previous);
  grid.updatedBy = req.user._id;
  await grid.save();

  await audit(req, "EVALUATION_GRID_UPDATED", {
    resource: "evaluationGrid", resourceId: grid._id,
    meta: { scale: grid.scale, criteria: grid.criteria.length, items: gridItems(grid).length },
  });
  res.json({ grid, locked: false });
};

// PATCH /api/admin/evaluations/settings — { evaluatorsPerTeam?, gapThreshold? }
// Toujours modifiable, même quand la grille est verrouillée
export const updateSettings = async (req, res) => {
  const edition = await currentEdition(res);
  if (!edition) return;
  const grid = await getGrid(edition);
  const { evaluatorsPerTeam, gapThreshold } = req.body;

  if (evaluatorsPerTeam !== undefined) {
    const n = Number(evaluatorsPerTeam);
    if (!Number.isInteger(n) || n < 1 || n > 10) return res.status(400).json({ code: "VALIDATION_ERROR" });
    grid.evaluatorsPerTeam = n;
  }
  if (gapThreshold !== undefined) {
    const g = Number(gapThreshold);
    if (!Number.isFinite(g) || g < 0 || g > grid.scale) return res.status(400).json({ code: "VALIDATION_ERROR" });
    grid.gapThreshold = g;
  }
  await grid.save();
  await audit(req, "EVALUATION_SETTINGS_CHANGED", {
    meta: { evaluatorsPerTeam: grid.evaluatorsPerTeam, gapThreshold: grid.gapThreshold },
  });
  res.json({ grid });
};

// ---------------------------------------------------------------------------
// F6.6 / F6.7 — Tableau de suivi
// ---------------------------------------------------------------------------

// GET /api/admin/evaluations
export const getOverview = async (req, res) => {
  const edition = await currentEdition(res);
  if (!edition) return;

  const [grid, locked, submissions, evaluations, deliberations, jurors] = await Promise.all([
    getGrid(edition),
    isGridLocked(edition),
    evaluableSubmissions(edition),
    Evaluation.find({ edition: edition._id }).populate("evaluator", "prenom nom email").lean(),
    Deliberation.find({ edition: edition._id }).lean(),
    User.find({ role: "jury" }).select("prenom nom email isVerified").sort({ nom: 1 }).lean(),
  ]);

  // Équipes : celles qui ont déposé + celles qui ont déjà des affectations
  const teams = new Map(
    submissions.map((s) => [String(s.team._id), { id: s.team._id, name: s.team.name, anonCode: s.anonCode, hasSubmission: true }])
  );
  const missingIds = evaluations.map((e) => String(e.team)).filter((id) => !teams.has(id));
  if (missingIds.length) {
    const extra = await Team.find({ _id: { $in: missingIds } }).select("name").lean();
    extra.forEach((t) => teams.set(String(t._id), { id: t._id, name: t.name, anonCode: null, hasSubmission: false }));
  }

  const delibByTeam = new Map(deliberations.map((d) => [String(d.team), d]));
  const teamRows = [...teams.values()].map((t) => {
    const evs = evaluations.filter((e) => String(e.team) === String(t.id));
    const delib = delibByTeam.get(String(t.id));
    return {
      ...t,
      evaluations: evs.map((e) => ({
        id: e._id,
        evaluator: e.evaluator ? { id: e.evaluator._id, name: fullName(e.evaluator) } : null,
        status: e.status, total: e.total, submittedAt: e.submittedAt, autoAssigned: e.autoAssigned,
      })),
      ...teamSummary(evs, grid, delib),
      deliberation: delib ? { finalScore: delib.finalScore, note: delib.note, at: delib.updatedAt } : null,
    };
  }).sort((a, b) => a.name.localeCompare(b.name));

  const evaluatorRows = jurors.map((j) => {
    const mine = evaluations.filter((e) => String(e.evaluator?._id) === String(j._id));
    const count = (s) => mine.filter((e) => e.status === s).length;
    return {
      id: j._id, name: fullName(j), email: j.email, active: j.isVerified,
      assigned: mine.length, pending: count("pending"), draft: count("draft"), submitted: count("submitted"),
    };
  });

  const count = (s) => evaluations.filter((e) => e.status === s).length;
  res.json({
    edition: { id: edition._id, year: edition.year },
    grid: {
      scale: grid.scale, evaluatorsPerTeam: grid.evaluatorsPerTeam, gapThreshold: grid.gapThreshold,
      ready: grid.criteria.length > 0, locked,
    },
    counts: {
      total: evaluations.length, pending: count("pending"), draft: count("draft"), submitted: count("submitted"),
      teams: teamRows.length,
      teamsWithoutEvaluator: teamRows.filter((t) => t.evaluations.length === 0).length,
      alerts: teamRows.filter((t) => t.alert && !t.deliberation).length,
    },
    evaluators: evaluatorRows,
    teams: teamRows,
  });
};

// GET /api/admin/evaluations/:id — détail complet d'une évaluation (admin uniquement)
export const getEvaluationDetail = async (req, res) => {
  const edition = await currentEdition(res);
  if (!edition) return;
  const evaluation = await Evaluation.findOne({ _id: req.params.id, edition: edition._id })
    .populate("evaluator", "prenom nom email")
    .populate("team", "name")
    .populate("history.by", "prenom nom")
    .lean();
  if (!evaluation) return res.status(404).json({ code: "NOT_FOUND" });

  const grid = await getGrid(edition);
  res.json({
    evaluation: {
      id: evaluation._id,
      team: { id: evaluation.team._id, name: evaluation.team.name },
      evaluator: { id: evaluation.evaluator._id, name: fullName(evaluation.evaluator), email: evaluation.evaluator.email },
      status: evaluation.status, scores: evaluation.scores, comment: evaluation.comment,
      total: evaluation.total, submittedAt: evaluation.submittedAt,
      history: evaluation.history.map((h) => ({ ...h, by: fullName(h.by) })),
      computed: computeTotal(grid, evaluation.scores),
    },
    grid,
  });
};

// ---------------------------------------------------------------------------
// F6.2 — Affectations
// ---------------------------------------------------------------------------

// POST /api/admin/evaluations/auto-assign — complète les affectations manquantes
export const autoAssign = async (req, res) => {
  const edition = await editableEdition(res);
  if (!edition) return;

  const grid = await getGrid(edition);
  const [submissions, jurors, existing] = await Promise.all([
    evaluableSubmissions(edition),
    User.find({ role: "jury" }).select("_id").lean(),
    Evaluation.find({ edition: edition._id }).select("team evaluator").lean(),
  ]);
  if (jurors.length === 0) return res.status(400).json({ code: "NO_JURY" });
  if (submissions.length === 0) return res.status(400).json({ code: "NO_SUBMISSIONS" });

  const plan = balancedAssignment({
    teamIds: submissions.map((s) => s.team._id),
    evaluatorIds: jurors.map((j) => j._id),
    existing,
    perTeam: grid.evaluatorsPerTeam,
  });

  if (plan.length) {
    await Evaluation.insertMany(
      plan.map((p) => ({
        edition: edition._id, team: p.team, evaluator: p.evaluator,
        assignedBy: req.user._id, autoAssigned: true,
      }))
    );
    await notifyAssignments(plan);
  }

  await audit(req, "EVALUATION_AUTO_ASSIGN", { meta: { created: plan.length, perTeam: grid.evaluatorsPerTeam } });
  res.json({
    created: plan.length,
    // Pas assez d'évaluateurs pour atteindre le nombre demandé par équipe
    notEnoughJury: jurors.length < grid.evaluatorsPerTeam,
  });
};

// POST /api/admin/evaluations/assign — { teamId, evaluatorId } : affectation manuelle
export const assign = async (req, res) => {
  const edition = await editableEdition(res);
  if (!edition) return;
  const { teamId, evaluatorId } = req.body;
  if (!mongoose.isValidObjectId(teamId) || !mongoose.isValidObjectId(evaluatorId)) {
    return res.status(400).json({ code: "FIELDS_REQUIRED" });
  }

  const [team, evaluator] = await Promise.all([
    Team.findOne({ _id: teamId, edition: edition._id }).select("_id").lean(),
    User.findOne({ _id: evaluatorId, role: "jury" }).select("_id").lean(),
  ]);
  if (!team || !evaluator) return res.status(404).json({ code: "NOT_FOUND" });
  if (await Evaluation.exists({ edition: edition._id, team: teamId, evaluator: evaluatorId })) {
    return res.status(409).json({ code: "ALREADY_ASSIGNED" });
  }

  const evaluation = await Evaluation.create({
    edition: edition._id, team: teamId, evaluator: evaluatorId, assignedBy: req.user._id,
  });
  await notifyAssignments([{ team: teamId, evaluator: evaluatorId }]);
  await audit(req, "EVALUATION_ASSIGNED", { resource: "evaluation", resourceId: evaluation._id, meta: { teamId, evaluatorId } });
  res.status(201).json({ id: evaluation._id });
};

// DELETE /api/admin/evaluations/:id — retirer une affectation (impossible une fois validée)
export const unassign = async (req, res) => {
  const edition = await editableEdition(res);
  if (!edition) return;
  const evaluation = await Evaluation.findOne({ _id: req.params.id, edition: edition._id });
  if (!evaluation) return res.status(404).json({ code: "NOT_FOUND" });
  if (evaluation.status === "submitted") return res.status(409).json({ code: "EVALUATION_SUBMITTED" });

  await evaluation.deleteOne();
  await audit(req, "EVALUATION_UNASSIGNED", {
    resource: "evaluation", resourceId: evaluation._id,
    meta: { teamId: evaluation.team, evaluatorId: evaluation.evaluator, status: evaluation.status },
  });
  res.json({ ok: true });
};

// ---------------------------------------------------------------------------
// F6.5 — Réouverture tracée
// ---------------------------------------------------------------------------

// PATCH /api/admin/evaluations/:id/reopen — { reason }
export const reopen = async (req, res) => {
  const edition = await editableEdition(res);
  if (!edition) return;
  const reason = String(req.body.reason || "").trim();
  if (!reason) return res.status(400).json({ code: "REASON_REQUIRED" });

  const evaluation = await Evaluation.findOne({ _id: req.params.id, edition: edition._id })
    .populate("evaluator", "prenom nom email locale");
  if (!evaluation) return res.status(404).json({ code: "NOT_FOUND" });
  if (evaluation.status !== "submitted") return res.status(409).json({ code: "EVALUATION_NOT_SUBMITTED" });

  evaluation.history.push({ action: "reopened", by: req.user._id, reason, total: evaluation.total });
  evaluation.status = "draft";
  evaluation.total = null;
  await evaluation.save();

  const ev = evaluation.evaluator;
  await Notification.create({
    user: ev._id, type: "evaluation_reopened",
    title: { fr: "Évaluation rouverte", en: "Evaluation reopened" },
    body: { fr: `Motif : ${reason}`, en: `Reason: ${reason}` },
    link: `/jury/evaluations/${evaluation._id}`,
  });
  await sendMailSafe({
    to: ev.email,
    ...reopenedMail({
      name: fullName(ev), reason, locale: ev.locale,
      link: `${process.env.FRONTEND_URL}/jury/evaluations/${evaluation._id}`,
    }),
  });
  await audit(req, "EVALUATION_REOPENED", { resource: "evaluation", resourceId: evaluation._id, meta: { reason } });
  res.json({ ok: true });
};

// ---------------------------------------------------------------------------
// F6.7 — Délibération (note retenue quand les évaluateurs sont trop éloignés)
// ---------------------------------------------------------------------------

// PUT /api/admin/evaluations/teams/:teamId/deliberation — { finalScore, note } ; finalScore null = annuler
export const setDeliberation = async (req, res) => {
  const edition = await editableEdition(res);
  if (!edition) return;
  if (!mongoose.isValidObjectId(req.params.teamId)) return res.status(404).json({ code: "NOT_FOUND" });
  const team = await Team.findOne({ _id: req.params.teamId, edition: edition._id }).select("_id").lean();
  if (!team) return res.status(404).json({ code: "NOT_FOUND" });

  const filter = { edition: edition._id, team: team._id };
  const { finalScore, note = "" } = req.body;

  if (finalScore === null || finalScore === "" || finalScore === undefined) {
    await Deliberation.deleteOne(filter);
    await audit(req, "EVALUATION_DELIBERATION_CLEARED", { meta: { teamId: team._id } });
    return res.json({ deliberation: null });
  }

  const grid = await getGrid(edition);
  const score = Number(finalScore);
  if (!Number.isFinite(score) || score < 0 || score > grid.scale) return res.status(400).json({ code: "INVALID_SCORE" });
  if (!String(note).trim()) return res.status(400).json({ code: "REASON_REQUIRED" });

  const deliberation = await Deliberation.findOneAndUpdate(
    filter,
    { finalScore: Math.round(score * 100) / 100, note: String(note).trim(), by: req.user._id },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  await audit(req, "EVALUATION_DELIBERATION", { meta: { teamId: team._id, finalScore: deliberation.finalScore } });
  res.json({ deliberation: { finalScore: deliberation.finalScore, note: deliberation.note, at: deliberation.updatedAt } });
};

// ---------------------------------------------------------------------------
// F6.8 — Export des notes détaillées
// ---------------------------------------------------------------------------

const EXPORT_LABELS = {
  fr: {
    summary: "Synthèse", detail: "Détail par critère",
    team: "Équipe", code: "Code anonyme", evaluator: "Évaluateur", status: "Statut",
    done: "Évaluations terminées", average: "Moyenne", gap: "Écart", alert: "Alerte écart",
    final: "Note retenue", delib: "Décision de délibération", total: "Total", comment: "Commentaire",
    yes: "Oui", no: "Non",
    statuses: { pending: "À faire", draft: "En cours", submitted: "Terminée" },
  },
  en: {
    summary: "Summary", detail: "Detail by criterion",
    team: "Team", code: "Anonymous code", evaluator: "Evaluator", status: "Status",
    done: "Completed evaluations", average: "Average", gap: "Gap", alert: "Gap alert",
    final: "Final score", delib: "Deliberation decision", total: "Total", comment: "Comment",
    yes: "Yes", no: "No",
    statuses: { pending: "To do", draft: "In progress", submitted: "Completed" },
  },
};

// GET /api/admin/evaluations/export?format=xlsx|csv&lang=fr|en
export const exportEvaluations = async (req, res) => {
  const edition = await currentEdition(res);
  if (!edition) return;
  const lang = req.query.lang === "en" ? "en" : "fr";
  const L = EXPORT_LABELS[lang];
  const format = req.query.format === "csv" ? "csv" : "xlsx";

  const [grid, submissions, evaluations, deliberations] = await Promise.all([
    getGrid(edition),
    evaluableSubmissions(edition),
    Evaluation.find({ edition: edition._id }).populate("evaluator", "prenom nom").populate("team", "name").lean(),
    Deliberation.find({ edition: edition._id }).lean(),
  ]);
  const anonOf = new Map(submissions.map((s) => [String(s.team._id), s.anonCode]));
  const delibOf = new Map(deliberations.map((d) => [String(d.team), d]));
  const label = (x) => (lang === "en" && x?.en) || x?.fr || "";
  const scale = `/${grid.scale}`;

  // Colonnes de détail : un critère = ses sous-critères (ou lui-même), puis sa contribution pondérée
  const columns = grid.criteria.flatMap((c) => {
    const leaves = c.subCriteria.length
      ? c.subCriteria.map((s) => ({ item: String(s._id), head: `${label(c.label)} › ${label(s.label)} (/${s.max})` }))
      : [{ item: String(c._id), head: `${label(c.label)} (/${c.max})` }];
    return [...leaves, { criterion: String(c._id), head: `${label(c.label)} — ${c.weight}% (${scale})` }];
  });

  const detailHeaders = [L.team, L.code, L.evaluator, L.status, ...columns.map((c) => c.head), `${L.total} (${scale})`, L.comment];
  const detailRows = evaluations
    .sort((a, b) => (a.team?.name ?? "").localeCompare(b.team?.name ?? "") || fullName(a.evaluator).localeCompare(fullName(b.evaluator)))
    .map((e) => {
      const values = new Map(e.scores.map((s) => [String(s.item), s.value]));
      const { byCriterion } = computeTotal(grid, e.scores);
      const contrib = new Map(byCriterion.map((c) => [c.criterion, c.contribution]));
      return [
        e.team?.name ?? "", anonOf.get(String(e.team?._id)) ?? "", fullName(e.evaluator), L.statuses[e.status],
        ...columns.map((c) => (c.item ? values.get(c.item) ?? "" : e.status === "submitted" ? contrib.get(c.criterion) : "")),
        e.status === "submitted" ? e.total : "",
        e.comment,
      ];
    });

  await audit(req, "EVALUATION_EXPORT", { meta: { format, rows: detailRows.length } });

  if (format === "csv") {
    // Excel en français attend la virgule décimale (15,6 et non 15.6)
    const num = (v) => (typeof v === "number" && lang === "fr" ? String(v).replace(".", ",") : v);
    const cell = (v) => `"${String(num(v) ?? "").replace(/"/g, '""')}"`;
    const csv = "﻿" + [detailHeaders, ...detailRows].map((r) => r.map(cell).join(";")).join("\r\n");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="notes-detaillees.csv"');
    return res.send(csv);
  }

  // Synthèse par équipe : moyenne, écart, note retenue, et moyenne de chaque critère
  const teamIds = [...new Set(evaluations.map((e) => String(e.team?._id)))];
  const summaryHeaders = [
    L.team, L.code, L.done, `${L.average} (${scale})`, `${L.gap} (${scale})`, L.alert, `${L.final} (${scale})`, L.delib,
    ...grid.criteria.map((c) => `${label(c.label)} — ${c.weight}% (${scale})`),
  ];
  const summaryRows = teamIds.map((id) => {
    const evs = evaluations.filter((e) => String(e.team?._id) === id);
    const done = evs.filter((e) => e.status === "submitted");
    const delib = delibOf.get(id);
    const s = teamSummary(evs, grid, delib);
    const perCriterion = grid.criteria.map((c) => {
      if (!done.length) return "";
      const sum = done.reduce((acc, e) => acc + computeTotal(grid, e.scores).byCriterion.find((b) => b.criterion === String(c._id)).contribution, 0);
      return Math.round((sum / done.length) * 100) / 100;
    });
    return [
      evs[0].team?.name ?? "", anonOf.get(id) ?? "", `${done.length}/${evs.length}`,
      s.average ?? "", s.gap ?? "", s.alert ? L.yes : L.no, s.final ?? "", delib?.note ?? "",
      ...perCriterion,
    ];
  }).sort((a, b) => String(a[0]).localeCompare(String(b[0])));

  const wb = new ExcelJS.Workbook();
  const addSheet = (name, headers, rows) => {
    const ws = wb.addWorksheet(name);
    ws.addRow(headers);
    rows.forEach((r) => ws.addRow(r));
    const head = ws.getRow(1);
    head.font = { bold: true, color: { argb: "FFFFFFFF" } };
    head.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF173A63" } };
    head.alignment = { wrapText: true, vertical: "middle" };
    ws.columns.forEach((col, i) => {
      const longest = Math.max(...[headers, ...rows].map((r) => String(r[i] ?? "").length));
      col.width = Math.min(Math.max(longest + 2, 10), 45);
    });
    ws.views = [{ state: "frozen", ySplit: 1, xSplit: 1 }];
  };
  addSheet(L.summary, summaryHeaders, summaryRows);
  addSheet(L.detail, detailHeaders, detailRows);

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", 'attachment; filename="notes-detaillees.xlsx"');
  await wb.xlsx.write(res);
  res.end();
};
