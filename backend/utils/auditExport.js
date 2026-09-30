import PDFDocument from "pdfkit";

const LABELS = {
  fr: {
    title: "Journal d'audit du sujet",
    generated: "Généré le",
    entries: "entrées",
    truncated: "Export limité aux plus récentes",
    page: "Page",
    columns: ["Date", "Utilisateur", "Rôle", "Équipe", "Action", "Détail", "IP"],
    actions: {
      SUBJECT_VIEW: "Consultation du sujet",
      SUBJECT_DOWNLOAD: "Téléchargement d'un document",
      SUBJECT_ZIP_DOWNLOAD: "Téléchargement du ZIP",
      SUBJECT_FILE_UPLOAD: "Ajout d'un document",
      SUBJECT_FILE_DELETE: "Suppression d'un document",
      SUBJECT_SESSION_OPEN_CHANGED: "Date d'ouverture modifiée",
      ADDENDUM_CREATE: "Addendum créé",
      ADDENDUM_UPDATE: "Addendum modifié",
      AUDIT_EXPORT: "Export du journal",
    },
  },
  en: {
    title: "Subject audit log",
    generated: "Generated on",
    entries: "entries",
    truncated: "Export limited to the most recent",
    page: "Page",
    columns: ["Date", "User", "Role", "Team", "Action", "Detail", "IP"],
    actions: {
      SUBJECT_VIEW: "Subject viewed",
      SUBJECT_DOWNLOAD: "Document downloaded",
      SUBJECT_ZIP_DOWNLOAD: "ZIP downloaded",
      SUBJECT_FILE_UPLOAD: "Document added",
      SUBJECT_FILE_DELETE: "Document deleted",
      SUBJECT_SESSION_OPEN_CHANGED: "Opening date changed",
      ADDENDUM_CREATE: "Addendum created",
      ADDENDUM_UPDATE: "Addendum updated",
      AUDIT_EXPORT: "Audit log exported",
    },
  },
};

const fmtDate = (d, lang) =>
  new Date(d).toLocaleString(lang === "en" ? "en-GB" : "fr-FR", {
    timeZone: "Africa/Tunis",
    dateStyle: "short",
    timeStyle: "medium",
  });

function describeMeta(meta = {}, lang) {
  if (meta.originalName) return meta.kind ? `${meta.originalName} (${meta.kind})` : meta.originalName;
  if (meta.from && meta.to) return `${fmtDate(meta.from, lang)} -> ${fmtDate(meta.to, lang)}`;
  if (meta.files != null) return `${meta.files} ZIP`;
  if (meta.version != null) return `v${meta.version}`;
  if (meta.format) return `${String(meta.format).toUpperCase()} (${meta.count ?? 0})`;
  return "";
}

// Transforme un document AuditLog (populé) en ligne de tableau
export function toRow(log, lang) {
  const L = LABELS[lang];
  return [
    fmtDate(log.at, lang),
    log.user ? `${log.user.prenom ?? ""} ${log.user.nom ?? ""}`.trim() : "",
    log.user?.role || log.role || "",
    log.team?.name || "",
    L.actions[log.action] || log.action,
    describeMeta(log.meta, lang),
    log.ip || "",
  ];
}

// ---------------------------------------------------------------------------
// CSV — séparateur ";" et BOM UTF-8 pour une ouverture correcte dans Excel (FR)
// ---------------------------------------------------------------------------

// Neutralise l'injection de formules (=, +, -, @) à l'ouverture dans Excel
const csvCell = (value) => {
  let s = String(value ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[";\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function buildCsv(logs, lang = "fr") {
  const L = LABELS[lang];
  const lines = [L.columns, ...logs.map((l) => toRow(l, lang))].map((r) => r.map(csvCell).join(";"));
  return "\uFEFF" + lines.join("\r\n") + "\r\n";
}

// ---------------------------------------------------------------------------
// PDF — A4 paysage, tableau paginé avec en-tête répété et numéros de page
// ---------------------------------------------------------------------------

const COLS = [
  { w: 92 }, { w: 105 }, { w: 55 }, { w: 90 }, { w: 130 }, { w: 215 }, { w: 75 },
]; // total 762 pt ≈ largeur utile (842 - 2 × 40)

export function pipeAuditPdf(logs, res, { lang = "fr", filtersText = "", truncatedAt = null } = {}) {
  const L = LABELS[lang];
  const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 40, bufferPages: true });
  doc.pipe(res);

  const left = doc.page.margins.left;
  const rowH = 20;
  const bottomLimit = () => doc.page.height - 50;

  const header = () => {
    let x = left;
    const y = doc.y;
    doc.save().rect(left, y, 762, rowH).fill("#0f2a4a").restore();
    doc.font("Helvetica-Bold").fontSize(9).fillColor("#ffffff");
    L.columns.forEach((c, i) => {
      doc.text(c, x + 5, y + 6, { width: COLS[i].w - 10, height: rowH, lineBreak: false });
      x += COLS[i].w;
    });
    doc.y = y + rowH;
  };

  // Titre
  doc.font("Helvetica-Bold").fontSize(16).fillColor("#0f2a4a").text(L.title);
  doc.moveDown(0.3).font("Helvetica").fontSize(9).fillColor("#475569")
    .text(`${L.generated} ${fmtDate(new Date(), lang)} — ${logs.length} ${L.entries}`);
  if (filtersText) doc.text(filtersText);
  if (truncatedAt) doc.fillColor("#b45309").text(`${L.truncated} ${truncatedAt}.`);
  doc.moveDown(0.8);
  header();

  logs.forEach((log, idx) => {
    if (doc.y + rowH > bottomLimit()) {
      doc.addPage();
      header();
    }
    const y = doc.y;
    if (idx % 2 === 0) doc.save().rect(left, y, 762, rowH).fill("#f1f5f9").restore();
    doc.font("Helvetica").fontSize(8).fillColor("#1e293b");
    let x = left;
    toRow(log, lang).forEach((cell, i) => {
      // `height` + `ellipsis` : le texte trop long est tronqué sur une seule ligne
      doc.text(cell, x + 5, y + 6, { width: COLS[i].w - 10, height: 10, ellipsis: true });
      x += COLS[i].w;
    });
    doc.y = y + rowH;
  });

  // Numéros de page (marge basse à 0 pour éviter une page vide automatique)
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i);
    doc.page.margins.bottom = 0;
    doc.font("Helvetica").fontSize(8).fillColor("#64748b")
      .text(`${L.page} ${i + 1} / ${range.count}`, left, doc.page.height - 30, {
        width: 762, align: "right", lineBreak: false,
      });
  }
  doc.end();
}