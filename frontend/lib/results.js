import { api, downloadProtectedFile } from "./api";

// --- Admin ---
export const getResultsAdmin = () => api("/api/admin/results");
export const saveResultsSettings = (settings) => api("/api/admin/results/settings", { method: "PATCH", body: settings });
export const publishResults = (publishAt) => api("/api/admin/results/publish", { method: "POST", body: { publishAt } });
export const withdrawResults = (reason) => api("/api/admin/results/withdraw", { method: "POST", body: { reason } });
export const resendResults = () => api("/api/admin/results/notify", { method: "POST" });
export const exportResults = (format, source, lang) =>
  downloadProtectedFile(`/api/admin/results/export?format=${format}&source=${source}&lang=${lang}`, `classement.${format}`);
export const downloadTeamCertificates = (teamId, lang) =>
  downloadProtectedFile(`/api/admin/results/certificates/${teamId}?lang=${lang}`, `attestations-${teamId}.pdf`);

// --- Public / participant ---
export const getPublicResults = () => api("/api/results");
export const downloadMyCertificate = (lang) =>
  downloadProtectedFile(`/api/results/certificate?lang=${lang}`, lang === "en" ? "certificate.pdf" : "attestation.pdf");

// Libellé d'un critère de départage ("lowestGap", "criterion:<id>"…)
export function tieBreakerLabel(key, criteria, t, locale) {
  if (key?.startsWith("criterion:")) {
    const c = criteria.find((x) => String(x.id) === key.slice(10));
    const label = c ? (locale === "en" && c.label.en) || c.label.fr : "?";
    return t("tieBreakers.criterion", { label });
  }
  return t(`tieBreakers.${key}`);
}
