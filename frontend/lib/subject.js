import { api } from "./api";

// Équipes validées et jury : /api/subject
export const getSubject = async () => {
  return api("/api/subject");
};

// Admin : /api/admin/subject (renvoie aussi state et notifiedAt)
export const getAdminSubject = async () => {
  return api("/api/admin/subject");
};

export const downloadSubjectZip = async () => {
  const res = await api("/api/subject/download.zip", { raw: true });
  return res.blob();
};

export const downloadSubjectFile = async (fileId) => {
  const res = await api(`/api/subject/files/${fileId}/download`, {
    raw: true,
  });
  return res.blob();
};

export const getSubjectAudit = async ({ page = 1, limit = 20, action, from, to } = {}) => {
  const params = new URLSearchParams({ page, limit });
  if (action) params.set("action", action);
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  return api(`/api/admin/subject/audit?${params}`);
};
export const exportSubjectAudit = async ({ format, lang, action, from, to } = {}) => {
  const params = new URLSearchParams({ format, lang: lang === "en" ? "en" : "fr" });
  if (action) params.set("action", action);
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const res = await api(`/api/admin/subject/audit/export?${params}`, { raw: true });
  return res.blob();
};
 export const createAddendum = (data) =>
  api("/api/admin/subject/addenda", { method: "POST", body: data });

export const updateAddendum = (id, data) =>
  api(`/api/admin/subject/addenda/${id}`, { method: "PUT", body: data });

export const deleteAddendum = (id) =>
  api(`/api/admin/subject/addenda/${id}`, { method: "DELETE" });