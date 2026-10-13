import { api, downloadProtectedFile } from "./api";

// --- Admin : toutes les fonctions de grille, suivi et affectation prennent une étape ---
// stage : "final" (jury, évaluation finale) ou "pre" (pilotage, pré-évaluation)

const STAGES_OK = ["final", "pre"];

// Vérifie l'étape avant tout appel : un oubli doit échouer ici, pas écrire dans la mauvaise grille
const checkStage = (stage) => {
  if (!STAGES_OK.includes(stage)) {
    throw new Error(`Étape d'évaluation invalide ou manquante : "${stage}"`);
  }
  return stage;
};

export const getEvaluationOverview = (stage = "final") =>
  api(`/api/admin/evaluations?stage=${checkStage(stage)}`);

export const getGrid = (stage = "final") =>
  api(`/api/admin/evaluations/grid?stage=${checkStage(stage)}`);

// L'étape est obligatoire : sans elle, la grille pré-évaluation serait écrite dans la grille jury
export const saveGrid = (grid, stage) =>
  api(`/api/admin/evaluations/grid?stage=${checkStage(stage)}`, { method: "PUT", body: grid });

// Réglages (affectation, écart) : propres à chaque étape
export const saveEvaluationSettings = (settings, stage = "final") =>
  api(`/api/admin/evaluations/settings?stage=${checkStage(stage)}`, { method: "PATCH", body: settings });

export const autoAssign = (stage = "final") =>
  api(`/api/admin/evaluations/auto-assign?stage=${checkStage(stage)}`, { method: "POST" });

export const assignEvaluator = (teamId, evaluatorId, stage = "final") =>
  api(`/api/admin/evaluations/assign?stage=${checkStage(stage)}`, {
    method: "POST",
    body: { teamId, evaluatorId },
  });

// Ces routes travaillent sur l'identifiant d'une évaluation : l'étape est déjà connue du serveur
export const unassignEvaluation = (id) =>
  api(`/api/admin/evaluations/${id}`, { method: "DELETE" });

export const getEvaluationDetail = (id) =>
  api(`/api/admin/evaluations/${id}`);

export const reopenEvaluation = (id, reason) =>
  api(`/api/admin/evaluations/${id}/reopen`, { method: "PATCH", body: { reason } });

// Délibération : réservée à l'étape finale (le serveur refuse "pre")
export const saveDeliberation = (teamId, finalScore, note) =>
  api(`/api/admin/evaluations/teams/${teamId}/deliberation?stage=final`, {
    method: "PUT",
    body: { finalScore, note },
  });

// Pondération des étapes dans la note totale (stockée sur la grille finale)
export const getStageWeights = () =>
  api("/api/admin/evaluations/stage-weights");

export const saveStageWeights = ({ pre, final }) =>
  api("/api/admin/evaluations/stage-weights", { method: "PATCH", body: { pre, final } });

export const exportEvaluations = (format, lang, stage = "final") =>
  downloadProtectedFile(
    `/api/admin/evaluations/export?stage=${checkStage(stage)}&format=${format}&lang=${lang}`,
    `notes-${stage}.${format}`
  );

// --- Jury : évaluation finale ---
export const getMyEvaluations = () => api("/api/jury/evaluations");
export const getMyEvaluation = (id) => api(`/api/jury/evaluations/${id}`);
export const saveMyEvaluation = (id, body) =>
  api(`/api/jury/evaluations/${id}`, { method: "PUT", body });
export const submitMyEvaluation = (id, body) =>
  api(`/api/jury/evaluations/${id}/submit`, { method: "POST", body });

// --- Pilotage : pré-évaluation (mêmes règles que le jury, sur sa propre route) ---
export const getPilotageEvaluations = () => api("/api/pilotage/evaluations");
export const getPilotageEvaluation = (id) => api(`/api/pilotage/evaluations/${id}`);
export const savePilotageEvaluation = (id, body) =>
  api(`/api/pilotage/evaluations/${id}`, { method: "PUT", body });
export const submitPilotageEvaluation = (id, body) =>
  api(`/api/pilotage/evaluations/${id}/submit`, { method: "POST", body });

// --- Utilitaires ---

// Texte bilingue { fr, en } dans la langue affichée (le français si l'anglais manque)
export const localized = (text, locale) => (locale === "en" && text?.en) || text?.fr || "";

// Même calcul que le serveur (utils/grading.js), pour afficher la note en direct pendant la saisie.
// La note enregistrée reste TOUJOURS celle calculée par le serveur.
export function previewTotal(grid, values) {
  const criteria = grid?.criteria ?? [];
  const weightSum = criteria.reduce((s, c) => s + (Number(c.weight) || 0), 0) || 1;
  let complete = criteria.length > 0;

  const byCriterion = criteria.map((c) => {
    const leaves = c.subCriteria?.length ? c.subCriteria : [c];
    const max = leaves.reduce((s, l) => s + l.max, 0);
    const points = leaves.reduce((s, l) => {
      const v = values[l._id];
      if (v === undefined || v === "") { complete = false; return s; }
      return s + Number(v);
    }, 0);
    const contribution = max ? (c.weight / weightSum) * (points / max) * grid.scale : 0;
    return { id: c._id, points, max, contribution: Math.round(contribution * 100) / 100 };
  });
  const total = Math.round(byCriterion.reduce((s, c) => s + c.contribution, 0) * 100) / 100;
  return { total, complete, byCriterion };
}

export const EVALUATION_STATUS_STYLES = {
  pending:   "bg-slate-100 text-slate-600",
  draft:     "bg-amber-50 text-amber-700",
  submitted: "bg-emerald-50 text-emerald-700",
};