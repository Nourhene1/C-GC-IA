import { api } from "./api";

// --- Équipe ---
export const getMySubmission = () => api("/api/submission");

export const depositFile = (kind, file) => {
  const body = new FormData();
  body.append("file", file);
  return api(`/api/submission/deliverables/${kind}`, { method: "POST", body });
};

export const depositLink = (kind, url) =>
  api(`/api/submission/deliverables/${kind}/link`, { method: "POST", body: { url } });

export const downloadMyVersion = async (versionId) =>
  (await api(`/api/submission/versions/${versionId}/download`, { raw: true })).blob();

// --- Admin ---
export const getAdminSubmissions = () => api("/api/admin/submissions");
export const getAdminTeam = (teamId) => api(`/api/admin/submissions/teams/${teamId}`);
export const updateSubmissionSettings = (settings) =>
  api("/api/admin/submissions/settings", { method: "PATCH", body: settings });
export const downloadAdminVersion = async (teamId, versionId) =>
  (await api(`/api/admin/submissions/teams/${teamId}/versions/${versionId}/download`, { raw: true })).blob();

// --- Jury ---
export const getJurySubmissions = () => api("/api/jury/submissions");
export const downloadJuryVersion = async (submissionId, versionId) =>
  (await api(`/api/jury/submissions/${submissionId}/versions/${versionId}/download`, { raw: true })).blob();

// --- Utilitaires ---
export function formatSize(bytes) {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}

export function saveBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export const DELIVERABLE_KINDS = ["report", "code", "slides", "video"];