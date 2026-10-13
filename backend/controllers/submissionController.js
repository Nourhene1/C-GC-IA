import Submission from "../models/Submission.js";
import { DELIVERABLES, MAX_VERSIONS_PER_KIND } from "../utils/submissionConfig.js";
import {
  getWindow, teamStatus, getOrCreateSubmission, hashFile, fixName,
  findVersion, sendVersionFile, presentItems, publicRules,
} from "../utils/submissions.js";
import { removeFile } from "../utils/files.js";
import { audit } from "../utils/audit.js";
import { sendMail } from "../utils/mailer.js"; // adaptez au nom réel de votre utilitaire d'e-mail
import { receiptMail } from "../utils/submissionEmails.js";

// GET /api/submission
export const getMySubmission = async (req, res) => {
  const now = new Date();
  const submission = await Submission.findOne({ edition: req.edition._id, team: req.team._id }).lean();
  const win = getWindow(req.edition, now);

  res.json({
    now,
    window: {
      state: win.state, opensAt: win.opensAt, deadline: win.deadline,
      closesAt: win.closesAt, toleranceMinutes: win.toleranceMin,
    },
    rules: publicRules(req.edition, now),
    status: teamStatus(submission, req.edition, now),
    items: presentItems(submission?.items),
  });
};

const buildReceipt = (team, kind, v) => ({
  id: v._id, team: team.name, kind, version: v.version,
  name: v.originalName ?? v.url, size: v.size ?? null, sha256: v.sha256 ?? null,
  url: v.url ?? null, receivedAt: v.receivedAt, late: !!v.late,
});

// Accusé par e-mail, sans bloquer la réponse
async function sendReceipt(req, receipt) {
  try {
    const link = `${process.env.FRONTEND_URL}/team/submission`;
    const { subject, text, html } = receiptMail({ receipt, locale: req.user.locale, link });
    await sendMail({ to: req.user.email, subject, text, html });
  } catch (err) {
    console.error("Accusé de dépôt :", err.message);
  }
}

// Enregistre une nouvelle version (fichier ou lien) : commun aux deux routes de dépôt
async function commit(req, res, kind, { file = null, url = null }) {
  const receivedAt = new Date(); // heure serveur, prise une fois le fichier entièrement reçu
  // Fenêtre propre au livrable : une présentation se ferme à l'annonce des résultats
  const win = getWindow(req.edition, receivedAt, kind);

  const reject = async (status, body) => {
    if (file) await removeFile(file.path);
    return res.status(status).json(body);
  };

  // Un gros fichier peut finir d'arriver après la clôture : on revérifie ici
  if (!win.canDeposit) {
    await audit(req, "SUBMISSION_REJECTED", { meta: { kind, reason: "closed_during_upload" } });
    return reject(403, { code: "SUBMISSIONS_CLOSED", closesAt: win.closesAt });
  }

  const submission = await getOrCreateSubmission(req.edition, req.team._id);
  let item = submission.items.find((i) => i.kind === kind);
  if (!item) {
    submission.items.push({ kind, versions: [] });
    item = submission.items.at(-1);
  }
  if (item.versions.length >= MAX_VERSIONS_PER_KIND) {
    return reject(409, { code: "TOO_MANY_VERSIONS", max: MAX_VERSIONS_PER_KIND });
  }

  item.versions.push({
    version: item.versions.length + 1,
    ...(file
      ? {
          fileName: file.filename,
          originalName: fixName(file.originalname),
          mimeType: file.mimetype,
          size: file.size,
          sha256: await hashFile(file.path),
        }
      : { url }),
    receivedAt,
    late: win.state === "grace",
    uploadedBy: req.user._id,
  });
  await submission.save();

  const version = item.versions.at(-1);
  await audit(req, file ? "SUBMISSION_UPLOAD" : "SUBMISSION_LINK", {
    resource: "submission", resourceId: submission._id,
    meta: { kind, version: version.version, name: version.originalName ?? url, size: version.size, late: version.late },
  });

  const receipt = buildReceipt(req.team, kind, version);
  sendReceipt(req, receipt);
  res.status(201).json({ receipt });
}

// POST /api/submission/deliverables/:kind  (multipart, champ "file")
export const depositFile = async (req, res) => {
  if (!req.file) return res.status(400).json({ code: "FILE_REQUIRED" });
  return commit(req, res, req.params.kind, { file: req.file });
};

// POST /api/submission/deliverables/:kind/link  (body : { url })
export const depositLink = async (req, res) => {
  const { kind } = req.params;
  if (!DELIVERABLES[kind]?.link) return res.status(400).json({ code: "LINK_NOT_ALLOWED" });

  let url;
  try {
    url = new URL(String(req.body.url ?? "").trim());
  } catch {
    return res.status(400).json({ code: "INVALID_URL" });
  }
  if (url.protocol !== "https:" || url.href.length > 500) {
    return res.status(400).json({ code: "INVALID_URL" });
  }
  return commit(req, res, kind, { url: url.href });
};

// GET /api/submission/versions/:versionId/download : uniquement les versions de sa propre équipe
export const downloadVersion = async (req, res) => {
  const submission = await Submission.findOne({ edition: req.edition._id, team: req.team._id }).lean();
  const found = findVersion(submission, req.params.versionId);
  if (!found?.version.fileName) return res.status(404).json({ code: "NOT_FOUND" });

  await audit(req, "SUBMISSION_DOWNLOAD", {
    resource: "submission", resourceId: submission._id,
    meta: { kind: found.kind, version: found.version.version },
  });
  sendVersionFile(res, found.version, found.version.originalName);
};