import archiver from "archiver";
import mongoose from "mongoose";
import Subject, { SUBJECT_KINDS } from "../models/Subject.js";
import Edition from "../models/Edition.js";
import AuditLog from "../models/Auditlog.js";
import { getCurrentEdition } from "../utils/edition.js";
import { removeFile, subjectFilePath } from "../utils/files.js";
import { withEnglish } from "../utils/autoTranslate.js";
import { audit } from "../utils/audit.js";
import { notifyValidatedTeams } from "../utils/subjectNotifier.js";
import { addendumMail } from "../utils/subjectEmails.js";
import { buildCsv, pipeAuditPdf } from "../utils/auditExport.js";

// On n'expose jamais le nom du fichier sur le disque
const publicFile = (f) => ({
  id: f._id, kind: f.kind, title: f.title, originalName: f.originalName,
  mimeType: f.mimeType, size: f.size, uploadedAt: f.uploadedAt,
});

const publicAddendum = (a) => ({
  id: a._id, version: a.version, title: a.title, content: a.content,
  publishedAt: a.publishedAt, updatedAt: a.updatedAt, history: a.history || [],
});

// ---------------------------------------------------------------------------
// Équipes validées, jury et admin (après subjectAccess)
// ---------------------------------------------------------------------------

// GET /api/subject — F4.2 / F4.3 / F4.7
export const getSubject = async (req, res) => {
  const now = new Date();
  const subject = await Subject.findOne({ edition: req.edition._id }).lean();
  await audit(req, "SUBJECT_VIEW");
  res.json({
    now,
    opensAt: req.edition.dates.sessionOpen,
    submissionDeadline: req.edition.dates.submissionDeadline,
    isOpen: now >= req.edition.dates.sessionOpen,
    files: (subject?.files ?? []).map(publicFile),
    addenda: (subject?.addenda ?? []).map(publicAddendum),
  });
};

// GET /api/subject/files/:fileId/download — F4.3 / F4.4 / F4.5
export const downloadFile = async (req, res) => {
  const subject = await Subject.findOne({ edition: req.edition._id }).select("files");
  const file = subject?.files.id(req.params.fileId);
  if (!file) return res.status(404).json({ code: "NOT_FOUND" });

  await audit(req, "SUBJECT_DOWNLOAD", {
    resource: "subject_file", resourceId: file._id, meta: { originalName: file.originalName },
  });
  res.set("Cache-Control", "private, no-store");
  res.download(subjectFilePath(file.fileName), file.originalName, (err) => {
    if (err && !res.headersSent) res.status(404).json({ code: "FILE_MISSING" });
  });
};

// GET /api/subject/download.zip — F4.5 : tous les documents dans un ZIP
export const downloadZip = async (req, res) => {
  const subject = await Subject.findOne({ edition: req.edition._id }).select("files").lean();
  if (!subject?.files.length) return res.status(404).json({ code: "NO_FILES" });

  await audit(req, "SUBJECT_ZIP_DOWNLOAD", { meta: { files: subject.files.length } });

  res.set("Cache-Control", "private, no-store");
  res.attachment(`sujet-${req.edition.year}.zip`);

  const archive = archiver("zip", { zlib: { level: 9 } });
  archive.on("warning", (err) => console.error("ZIP :", err.message));
  archive.on("error", (err) => { console.error("ZIP :", err.message); res.destroy(err); });
  archive.pipe(res);

  const used = new Set();
  subject.files.forEach((f, i) => {
    const name = used.has(f.originalName) ? `${i + 1}_${f.originalName}` : f.originalName;
    used.add(name);
    archive.file(subjectFilePath(f.fileName), { name });
  });
  await archive.finalize();
};

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

const resolveEdition = (req) =>
  req.query.edition ? Edition.findById(req.query.edition) : getCurrentEdition();

const findOrNewSubject = async (edition) =>
  (await Subject.findOne({ edition: edition._id })) ?? new Subject({ edition: edition._id });

// GET /api/admin/subject
export const adminGetSubject = async (req, res) => {
  const edition = await resolveEdition(req);
  if (!edition) return res.status(404).json({ code: "NO_EDITION" });

  const now = new Date();
  const subject = await Subject.findOne({ edition: edition._id }).lean();
  res.json({
    now,
    edition: { id: edition._id, year: edition.year },
    opensAt: edition.dates.sessionOpen,
    submissionDeadline: edition.dates.submissionDeadline,
    isOpen: now >= edition.dates.sessionOpen,
    state: now >= edition.dates.sessionOpen ? "publie" : "masque", // F4.1
    notifiedAt: subject?.notifiedAt ?? null,
    files: (subject?.files ?? []).map(publicFile),
    addenda: (subject?.addenda ?? []).map(publicAddendum),
  });
};

// POST /api/admin/subject/files — champs : file, kind (enonce|donnees|annexe), title — F4.1
export const addFile = async (req, res) => {
  if (!req.file) return res.status(400).json({ code: "FILE_REQUIRED" });

  const kind = req.body.kind || "annexe";
  if (!SUBJECT_KINDS.includes(kind)) {
    await removeFile(req.file.path);
    return res.status(400).json({ code: "INVALID_KIND" });
  }
  const edition = await resolveEdition(req);
  if (!edition) {
    await removeFile(req.file.path);
    return res.status(404).json({ code: "NO_EDITION" });
  }

  const subject = await findOrNewSubject(edition);
  subject.files.push({
    kind,
    title: req.body.title || "",
    fileName: req.file.filename,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
  });
  await subject.save();

  const file = subject.files.at(-1);
  await audit(req, "SUBJECT_FILE_UPLOAD", { resource: "subject_file", resourceId: file._id, meta: { originalName: file.originalName, kind } });
  res.status(201).json({ file: publicFile(file) });
};

// DELETE /api/admin/subject/files/:fileId
export const removeSubjectFile = async (req, res) => {
  const edition = await resolveEdition(req);
  if (!edition) return res.status(404).json({ code: "NO_EDITION" });

  const subject = await Subject.findOne({ edition: edition._id });
  const file = subject?.files.id(req.params.fileId);
  if (!file) return res.status(404).json({ code: "NOT_FOUND" });

  const { _id, fileName, originalName } = file;
  subject.files.pull(_id);
  await subject.save();
  await removeFile(subjectFilePath(fileName));
  await audit(req, "SUBJECT_FILE_DELETE", { resource: "subject_file", resourceId: _id, meta: { originalName } });
  res.json({ ok: true });
};

// PATCH /api/admin/subject/session-open — body : { sessionOpen: "2026-11-20T09:00:00+01:00" } — F4.2
export const setSessionOpen = async (req, res) => {
  const date = new Date(req.body.sessionOpen);
  if (!req.body.sessionOpen || Number.isNaN(date.getTime())) {
    return res.status(400).json({ code: "INVALID_DATE" });
  }
  const edition = await resolveEdition(req);
  if (!edition) return res.status(404).json({ code: "NO_EDITION" });

  const previous = edition.dates.sessionOpen;
  edition.dates.sessionOpen = date;
  await edition.save(); // refuse une ouverture après la date limite de dépôt

  // Ouverture reportée dans le futur : la notification devra repartir à la nouvelle heure
  if (date > new Date()) await Subject.updateOne({ edition: edition._id }, { notifiedAt: null });

  await audit(req, "SUBJECT_SESSION_OPEN_CHANGED", { meta: { from: previous, to: date } });
  res.json({ opensAt: edition.dates.sessionOpen });
};

// --- F4.7 : addenda -------------------------------------------------------

// Envoi in-app + email (sans bloquer la réponse)
function notifyAddendum(edition, addendum, updated) {
  const link = `${process.env.FRONTEND_URL}/team/subject`;
  return notifyValidatedTeams(edition, {
    type: "subject_addendum",
    title: {
      fr: updated ? "Addendum mis à jour" : "Nouvel addendum au sujet",
      en: updated ? "Addendum updated" : "New subject addendum",
    },
    body: { fr: addendum.title.fr, en: addendum.title.en },
    path: "/team/subject",
    mail: (locale) => addendumMail({ addendum, locale, link }),
  }).catch((err) => console.error("Notif addendum :", err.message));
}

// POST /api/admin/subject/addenda — body : { title: {fr}, content: {fr} }
export const createAddendum = async (req, res) => {
  const edition = await resolveEdition(req);
  if (!edition) return res.status(404).json({ code: "NO_EDITION" });
  if (new Date() < edition.dates.sessionOpen) return res.status(409).json({ code: "SUBJECT_NOT_OPEN" });

  const { title, content } = req.body;
  if (!title?.fr?.trim() || !content?.fr?.trim()) return res.status(400).json({ code: "VALIDATION_ERROR" });

  const subject = await findOrNewSubject(edition);
  subject.addenda.push({
    title: await withEnglish(title, {}),
    content: await withEnglish(content, {}),
    createdBy: req.user._id,
  });
  await subject.save();

  const addendum = subject.addenda.at(-1);
  await audit(req, "ADDENDUM_CREATE", { resource: "addendum", resourceId: addendum._id });
  notifyAddendum(edition, addendum, false);
  res.status(201).json({ addendum: publicAddendum(addendum) });
};

// PUT /api/admin/subject/addenda/:id — nouvelle version, l'ancienne va dans l'historique
export const updateAddendum = async (req, res) => {
  const subject = await Subject.findOne({ "addenda._id": req.params.id }).populate("edition");
  const addendum = subject?.addenda.id(req.params.id);
  if (!addendum) return res.status(404).json({ code: "NOT_FOUND" });

  const { title, content } = req.body;
  if (!title?.fr?.trim() || !content?.fr?.trim()) return res.status(400).json({ code: "VALIDATION_ERROR" });

  addendum.history.push({
    version: addendum.version,
    title: { fr: addendum.title.fr, en: addendum.title.en },
    content: { fr: addendum.content.fr, en: addendum.content.en },
    at: addendum.updatedAt || addendum.publishedAt,
  });
  addendum.title = await withEnglish(title, addendum.title);
  addendum.content = await withEnglish(content, addendum.content);
  addendum.version += 1;
  addendum.updatedAt = new Date();
  await subject.save();

  await audit(req, "ADDENDUM_UPDATE", { resource: "addendum", resourceId: addendum._id, meta: { version: addendum.version } });
  if (req.body.notify === true) notifyAddendum(subject.edition, addendum, true);
  res.json({ addendum: publicAddendum(addendum) });
};

// --- F4.4 : consultation et export du journal -----------------------------

const MAX_EXPORT = 10000;

// Filtre commun à la liste et à l'export ; renvoie { error } si un paramètre est invalide
function buildAuditFilter({ team, user, action, from, to }) {
  const filter = {};
  if (team) {
    if (!mongoose.isValidObjectId(team)) return { error: "INVALID_TEAM" };
    filter.team = String(team);
  }
  if (user) {
    if (!mongoose.isValidObjectId(user)) return { error: "INVALID_USER" };
    filter.user = String(user);
  }
  if (action) filter.action = String(action);
  if (from || to) {
    filter.at = {};
    for (const [key, op, value] of [["from", "$gte", from], ["to", "$lte", to]]) {
      if (!value) continue;
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return { error: key === "from" ? "INVALID_FROM" : "INVALID_TO" };
      filter.at[op] = date;
    }
  }
  return { filter };
}

const populateAudit = (query) =>
  query.populate("user", "nom prenom email role").populate("team", "name");

// GET /api/admin/subject/audit?team=&user=&action=&from=&to=&page=&limit=
export const listAudit = async (req, res) => {
  const { filter, error } = buildAuditFilter(req.query);
  if (error) return res.status(400).json({ code: error });

  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const page = Math.max(Number(req.query.page) || 1, 1);

  const [logs, total] = await Promise.all([
    populateAudit(AuditLog.find(filter).sort({ at: -1 }).skip((page - 1) * limit).limit(limit)).lean(),
    AuditLog.countDocuments(filter),
  ]);
  res.json({ logs, total, page, pages: Math.ceil(total / limit) });
};

// GET /api/admin/subject/audit/export?format=csv|pdf&lang=fr|en&team=&user=&action=&from=&to=
export const exportAudit = async (req, res) => {
  const { format } = req.query;
  if (!["csv", "pdf"].includes(format)) return res.status(400).json({ code: "INVALID_FORMAT" });

  const { filter, error } = buildAuditFilter(req.query);
  if (error) return res.status(400).json({ code: error });

  const lang = req.query.lang === "en" ? "en" : "fr";

  // MAX_EXPORT + 1 pour savoir si le résultat a été tronqué
  let logs = await populateAudit(AuditLog.find(filter).sort({ at: -1 }).limit(MAX_EXPORT + 1)).lean();
  const truncated = logs.length > MAX_EXPORT;
  if (truncated) logs = logs.slice(0, MAX_EXPORT);

  await audit(req, "AUDIT_EXPORT", {
    meta: {
      format, count: logs.length,
      filters: Object.fromEntries(
        ["team", "user", "action", "from", "to"].filter((k) => req.query[k]).map((k) => [k, req.query[k]])
      ),
    },
  });

  const stamp = new Date().toISOString().slice(0, 10);
  const filename = `audit-sujet-${stamp}.${format}`;
  res.set("Cache-Control", "private, no-store");

  if (format === "csv") {
    res.attachment(filename);
    res.type("text/csv; charset=utf-8");
    return res.send(buildCsv(logs, lang));
  }

  const { action, from, to } = req.query;
  const filtersText = [
    action && `Action : ${action}`,
    from && `${lang === "en" ? "From" : "Du"} : ${from}`,
    to && `${lang === "en" ? "To" : "Au"} : ${to}`,
  ].filter(Boolean).join("   |   ");

  res.attachment(filename);
  res.type("application/pdf");
  pipeAuditPdf(logs, res, { lang, filtersText, truncatedAt: truncated ? MAX_EXPORT : null });
};
// DELETE /api/admin/subject/addenda/:id
export const deleteAddendum = async (req, res) => {
  const subject = await Subject.findOne({ "addenda._id": req.params.id });
  const addendum = subject?.addenda.id(req.params.id);
  if (!addendum) return res.status(404).json({ code: "NOT_FOUND" });

  const { _id, version } = addendum;
  const title = addendum.title.fr;
  subject.addenda.pull(_id);
  await subject.save();

  await audit(req, "ADDENDUM_DELETE", {
    resource: "addendum", resourceId: _id, meta: { version, title },
  });
  res.json({ ok: true });
};
