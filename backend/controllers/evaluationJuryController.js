import mongoose from "mongoose";
import Evaluation from "../models/Evaluation.js";
import Submission from "../models/Submission.js";
import { getCurrentEdition } from "../utils/edition.js";
import { getWindow, neutralName } from "../utils/submissions.js";
import { DELIVERABLE_KINDS } from "../utils/submissionConfig.js";
import { audit } from "../utils/audit.js";
import { cleanScores, computeTotal } from "../utils/grading.js";
import { getGrid } from "../utils/evaluations.js";
import { resultsLocked } from "../utils/results.js";

// F6.9 : un évaluateur ne voit QUE ses propres évaluations.
// Aucune route jury ne renvoie les notes des autres évaluateurs, ni les moyennes.

// Les évaluations commencent après la clôture des dépôts (mêmes règles que l'accès aux livrables)
async function juryEdition(res) {
  const edition = await getCurrentEdition();
  if (!edition) { res.status(404).json({ code: "NO_EDITION" }); return null; }
  const win = getWindow(edition);
  if (win.state !== "closed") {
    res.status(403).json({ code: "SUBMISSIONS_STILL_OPEN", closesAt: win.closesAt });
    return null;
  }
  return edition;
}

// Fin de la phase d'évaluation (facultative, réglée dans les dates de l'édition)
const evaluationClosed = (edition) =>
  edition.dates.evaluationEnd ? new Date() > new Date(edition.dates.evaluationEnd) : false;

const anonymized = (edition) => !!edition.submission?.anonymize;

// Nom affiché de l'équipe : code anonyme si l'évaluation est à l'aveugle (F5.8)
const teamLabel = (edition, submission, team) =>
  anonymized(edition) ? submission?.anonCode ?? "—" : team?.name ?? "";

async function findMine(req, res, edition) {
  if (!mongoose.isValidObjectId(req.params.id)) { res.status(404).json({ code: "NOT_FOUND" }); return null; }
  const evaluation = await Evaluation.findOne({ _id: req.params.id, edition: edition._id, evaluator: req.user._id });
  if (!evaluation) { res.status(404).json({ code: "NOT_FOUND" }); return null; }
  return evaluation;
}

// GET /api/jury/evaluations — mes équipes à évaluer
export const myEvaluations = async (req, res) => {
  const edition = await juryEdition(res);
  if (!edition) return;

  const [grid, evaluations] = await Promise.all([
    getGrid(edition),
    Evaluation.find({ edition: edition._id, evaluator: req.user._id }).populate("team", "name").lean(),
  ]);
  const subs = await Submission.find({ edition: edition._id, team: { $in: evaluations.map((e) => e.team?._id) } })
    .select("team anonCode").lean();
  const subOf = new Map(subs.map((s) => [String(s.team), s]));

  const rows = evaluations
    .map((e) => ({
      id: e._id,
      label: teamLabel(edition, subOf.get(String(e.team?._id)), e.team),
      status: e.status,
      total: e.status === "submitted" ? e.total : computeTotal(grid, e.scores).total,
      submittedAt: e.submittedAt,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  res.json({
    scale: grid.scale,
    gridReady: grid.criteria.length > 0,
    anonymized: anonymized(edition),
    evaluationEnd: edition.dates.evaluationEnd ?? null,
    closed: evaluationClosed(edition),
    evaluations: rows,
  });
};

// GET /api/jury/evaluations/:id — grille + mes notes + livrables de l'équipe
export const myEvaluation = async (req, res) => {
  const edition = await juryEdition(res);
  if (!edition) return;
  const evaluation = await findMine(req, res, edition);
  if (!evaluation) return;
  await evaluation.populate("team", "name");

  const grid = await getGrid(edition);
  const submission = await Submission.findOne({ edition: edition._id, team: evaluation.team._id }).lean();
  const anon = anonymized(edition);

  // Dernière version de chaque livrable (téléchargement par la route jury du Module 5)
  const deliverables = DELIVERABLE_KINDS.map((kind) => {
    const v = submission?.items.find((i) => i.kind === kind)?.versions.at(-1);
    return {
      kind,
      version: v && {
        id: v._id, size: v.size ?? null, url: v.url ?? null, late: !!v.late, receivedAt: v.receivedAt,
        name: v.fileName ? (anon ? neutralName(submission.anonCode, kind, v) : v.originalName) : null,
      },
    };
  });

  res.json({
    evaluation: {
      id: evaluation._id,
      label: teamLabel(edition, submission, evaluation.team),
      status: evaluation.status,
      scores: evaluation.scores,
      comment: evaluation.comment,
      submittedAt: evaluation.submittedAt,
      computed: computeTotal(grid, evaluation.scores),
    },
    grid: { scale: grid.scale, criteria: grid.criteria },
    submissionId: submission?._id ?? null,
    deliverables,
    closed: evaluationClosed(edition),
  });
};

// Enregistre les notes (commun au brouillon et à la validation)
async function applyScores(req, res, { submit }) {
  const edition = await juryEdition(res);
  if (!edition) return;
  if (evaluationClosed(edition)) return res.status(403).json({ code: "EVALUATION_CLOSED" });
  if (await resultsLocked(edition)) return res.status(409).json({ code: "RESULTS_PUBLISHED" }); // F7.4

  const evaluation = await findMine(req, res, edition);
  if (!evaluation) return;
  // F6.5 : une évaluation validée est verrouillée ; seul l'admin peut la rouvrir
  if (evaluation.status === "submitted") return res.status(409).json({ code: "EVALUATION_LOCKED" });

  const grid = await getGrid(edition);
  if (!grid.criteria.length) return res.status(409).json({ code: "GRID_NOT_READY" });

  const { scores, error } = cleanScores(grid, req.body.scores);
  if (error) return res.status(400).json({ code: error });
  const comment = String(req.body.comment ?? "").trim().slice(0, 5000);
  const computed = computeTotal(grid, scores);

  if (submit && !computed.complete) return res.status(400).json({ code: "EVALUATION_INCOMPLETE" });

  evaluation.scores = scores;
  evaluation.comment = comment;
  if (submit) {
    evaluation.status = "submitted";
    evaluation.total = computed.total; // F6.4 : calculée par le serveur, jamais envoyée par le navigateur
    evaluation.submittedAt = new Date();
    evaluation.history.push({ action: "submitted", by: req.user._id, total: computed.total });
  } else {
    evaluation.status = "draft";
  }
  await evaluation.save();

  if (submit) {
    await audit(req, "EVALUATION_SUBMITTED", {
      resource: "evaluation", resourceId: evaluation._id, meta: { total: computed.total },
    });
  }
  res.json({ status: evaluation.status, computed, submittedAt: evaluation.submittedAt });
}

// PUT /api/jury/evaluations/:id — { scores: [{ item, value }], comment } : brouillon
export const saveDraft = (req, res) => applyScores(req, res, { submit: false });

// POST /api/jury/evaluations/:id/submit — validation définitive
export const submitEvaluation = (req, res) => applyScores(req, res, { submit: true });
