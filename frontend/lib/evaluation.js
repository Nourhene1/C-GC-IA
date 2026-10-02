import { api, downloadProtectedFile } from "./api";

// --- Admin ---
export const getEvaluationOverview = () => api("/api/admin/evaluations");
export const getGrid = () => api("/api/admin/evaluations/grid");
export const saveGrid = (grid) => api("/api/admin/evaluations/grid", { method: "PUT", body: grid });
export const saveEvaluationSettings = (settings) =>
  api("/api/admin/evaluations/settings", { method: "PATCH", body: settings });
export const autoAssign = () => api("/api/admin/evaluations/auto-assign", { method: "POST" });
export const assignEvaluator = (teamId, evaluatorId) =>
  api("/api/admin/evaluations/assign", { method: "POST", body: { teamId, evaluatorId } });
export const unassignEvaluation = (id) => api(`/api/admin/evaluations/${id}`, { method: "DELETE" });
export const getEvaluationDetail = (id) => api(`/api/admin/evaluations/${id}`);
export const reopenEvaluation = (id, reason) =>
  api(`/api/admin/evaluations/${id}/reopen`, { method: "PATCH", body: { reason } });
export const saveDeliberation = (teamId, finalScore, note) =>
  api(`/api/admin/evaluations/teams/${teamId}/deliberation`, { method: "PUT", body: { finalScore, note } });
export const exportEvaluations = (format, lang) =>
  downloadProtectedFile(`/api/admin/evaluations/export?format=${format}&lang=${lang}`, `notes-detaillees.${format}`);

// --- Jury ---
export const getMyEvaluations = () => api("/api/jury/evaluations");
export const getMyEvaluation = (id) => api(`/api/jury/evaluations/${id}`);
export const saveMyEvaluation = (id, body) => api(`/api/jury/evaluations/${id}`, { method: "PUT", body });
export const submitMyEvaluation = (id, body) =>
  api(`/api/jury/evaluations/${id}/submit`, { method: "POST", body });

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
