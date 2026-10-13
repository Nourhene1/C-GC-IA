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

// F6.9 : un évaluateur ne voit QUE ses propres évaluations, dans l'étape qui le concerne.
// Aucune route ne renvoie les notes des autres évaluateurs, ni les moyennes.

const evaluationClosed = (edition) =>
  edition.dates.evaluationEnd ? new Date() > new Date(edition.dates.evaluationEnd) : false;

const anonymized = (edition) => !!edition.submission?.anonymize;

// Nom affiché de l'équipe : code anonyme si l'évaluation est à l'aveugle
const teamLabel = (edition, submission, team) =>
  anonymized(edition) ? submission?.anonCode ?? "—" : team?.name ?? "";

// Crée les handlers d'une étape : "final" (jury) ou "pre" (pilotage)
export function createEvaluationHandlers(stage) {
  // Les évaluations commencent après la clôture des dépôts
  async function openEdition(res) {
    const edition = await getCurrentEdition();
    if (!edition) { res.status(404).json({ code: "NO_EDITION" }); return null; }
    const win = getWindow(edition);
    if (win.state !== "closed") {
      res.status(403).json({ code: "SUBMISSIONS_STILL_OPEN", closesAt: win.closesAt });
      return null;
    }
    return edition;
  }

  async function findMine(req, res, edition) {
    if (!mongoose.isValidObjectId(req.params.id)) { res.status(404).json({ code: "NOT_FOUND" }); return null; }
    const evaluation = await Evaluation.findOne({
      _id: req.params.id, edition: edition._id, stage, evaluator: req.user._id,
    });
    if (!evaluation) { res.status(404).json({ code: "NOT_FOUND" }); return null; }
    return evaluation;
  }

  // GET — mes équipes à évaluer dans cette étape
  async function list(req, res) {
    const edition = await openEdition(res);
    if (!edition) return;

    const [grid, evaluations] = await Promise.all([
      getGrid(edition, stage),
      Evaluation.find({ edition: edition._id, stage, evaluator: req.user._id }).populate("team", "name").lean(),
    ]);
    const subs = await Submission.find({
      edition: edition._id, team: { $in: evaluations.map((e) => e.team?._id) },
    }).select("team anonCode").lean();
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
      stage,
      scale: grid.scale,
      gridReady: grid.criteria.length > 0,
      anonymized: anonymized(edition),
      evaluationEnd: edition.dates.evaluationEnd ?? null,
      closed: evaluationClosed(edition),
      evaluations: rows,
    });
  }

  // GET — grille + mes notes + livrables de l'équipe
  async function detail(req, res) {
    const edition = await openEdition(res);
    if (!edition) return;
    const evaluation = await findMine(req, res, edition);
    if (!evaluation) return;
    await evaluation.populate("team", "name");

    const grid = await getGrid(edition, stage);
    const submission = await Submission.findOne({ edition: edition._id, team: evaluation.team._id }).lean();
    const anon = anonymized(edition);

    // Dernière version de chaque livrable
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
      stage,
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
  }

  // Enregistre les notes (commun au brouillon et à la validation)
  async function applyScores(req, res, { submit }) {
    const edition = await openEdition(res);
    if (!edition) return;
    if (evaluationClosed(edition)) return res.status(403).json({ code: "EVALUATION_CLOSED" });
    if (await resultsLocked(edition)) return res.status(409).json({ code: "RESULTS_PUBLISHED" });

    const evaluation = await findMine(req, res, edition);
    if (!evaluation) return;
    // Une évaluation validée est verrouillée ; seul l'admin peut la rouvrir
    if (evaluation.status === "submitted") return res.status(409).json({ code: "EVALUATION_LOCKED" });

    const grid = await getGrid(edition, stage);
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
      evaluation.total = computed.total; // calculée par le serveur, jamais envoyée par le navigateur
      evaluation.submittedAt = new Date();
      evaluation.history.push({ action: "submitted", by: req.user._id, total: computed.total });
    } else {
      evaluation.status = "draft";
    }
    await evaluation.save();

    if (submit) {
      await audit(req, "EVALUATION_SUBMITTED", {
        resource: "evaluation", resourceId: evaluation._id, meta: { stage, total: computed.total },
      });
    }
    res.json({ status: evaluation.status, computed, submittedAt: evaluation.submittedAt });
  }

  return {
    list,
    detail,
    saveDraft: (req, res) => applyScores(req, res, { submit: false }),
    submit: (req, res) => applyScores(req, res, { submit: true }),
  };
}

// Handlers du jury (évaluation finale) et du pilotage (pré-évaluation)
export const juryHandlers = createEvaluationHandlers("final");
export const pilotageHandlers = createEvaluationHandlers("pre");