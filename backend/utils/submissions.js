import fs from "fs";
import path from "path";
import crypto from "crypto";
import Submission from "../models/Submission.js";
import { DELIVERABLES, DELIVERABLE_KINDS, REQUIRED_KINDS } from "./submissionConfig.js";

export const SUBMISSION_DIR = path.resolve("uploads", "private", "submissions");
export const submissionFilePath = (fileName) => path.join(SUBMISSION_DIR, path.basename(fileName));

// Champ de l'édition qui fixe la fermeture d'un livrable
export const depositDateKey = (kind) =>
  DELIVERABLES[kind]?.deadline === "results" ? "resultsDate" : "submissionDeadline";

// --- F5.1 / F5.2 : fenêtre de dépôt d'un livrable (heure du serveur) ---
// not_open → open → grace (tolérance, dépôt "en retard") → closed
// kind absent : fenêtre standard (date limite de dépôt)
export function getWindow(edition, now = new Date(), kind = null) {
  const opensAt = new Date(edition.dates.sessionOpen);
  const key = depositDateKey(kind);
  const deadline = new Date(edition.dates[key]);
  // La tolérance ne s'applique qu'à la date limite de dépôt, pas à l'annonce des résultats
  const toleranceMin = key === "submissionDeadline" ? (edition.submission?.toleranceMinutes ?? 0) : 0;
  const closesAt = new Date(deadline.getTime() + toleranceMin * 60_000);

  let state = "open";
  if (now < opensAt) state = "not_open";
  else if (now > closesAt) state = "closed";
  else if (now > deadline) state = "grace";

  return { state, opensAt, deadline, closesAt, toleranceMin, canDeposit: state === "open" || state === "grace" };
}

// --- F5.7 : statut de dépôt d'une équipe ---
export function teamStatus(submission, edition, now = new Date()) {
  const items = submission?.items ?? [];
  const has = (kind) => (items.find((i) => i.kind === kind)?.versions.length ?? 0) > 0;
  const lateDeposit = items.some((i) => i.versions.at(-1)?.late);
  const pastDeadline = now > new Date(edition.dates.submissionDeadline);

  if (lateDeposit) return "late";
  if (REQUIRED_KINDS.every(has)) return "submitted";
  return pastDeadline ? "late" : "not_submitted";
}

// --- F5.8 : code anonyme (sans I, O, 0, 1 pour éviter les confusions) ---
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const randomCode = () =>
  "E-" + Array.from(crypto.randomBytes(4), (b) => ALPHABET[b % 32]).join("");

export async function getOrCreateSubmission(edition, teamId) {
  const find = () => Submission.findOne({ edition: edition._id, team: teamId });
  const existing = await find();
  if (existing) return existing;

  for (let i = 0; i < 5; i++) {
    try {
      return await Submission.create({ edition: edition._id, team: teamId, anonCode: randomCode(), items: [] });
    } catch (err) {
      if (err.code !== 11000) throw err;
      const again = await find(); // course entre deux dépôts simultanés
      if (again) return again;
    }
  }
  throw new Error("ANON_CODE_GENERATION_FAILED");
}

// --- Fichiers ---
export const hashFile = (filePath) =>
  new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    fs.createReadStream(filePath)
      .on("data", (chunk) => hash.update(chunk))
      .on("end", () => resolve(hash.digest("hex")))
      .on("error", reject);
  });

// multer décode parfois les noms en latin1 : "prÃ©sentation.pptx" → "présentation.pptx"
export function fixName(name) {
  const fixed = Buffer.from(name, "latin1").toString("utf8");
  return fixed.includes("\uFFFD") ? name : fixed;
}

export function sendVersionFile(res, version, downloadName) {
  res.set("Cache-Control", "private, no-store");
  res.download(submissionFilePath(version.fileName), downloadName, (err) => {
    if (err && !res.headersSent) res.status(404).json({ code: "FILE_MISSING" });
  });
}

export function findVersion(submission, versionId) {
  for (const item of submission?.items ?? []) {
    const version = item.versions.find((v) => String(v._id) === String(versionId));
    if (version) return { kind: item.kind, version };
  }
  return null;
}

// --- Présentation (on n'expose jamais fileName, le nom sur le disque) ---
export const publicVersion = (v) => ({
  id: v._id, version: v.version, originalName: v.originalName ?? null,
  mimeType: v.mimeType ?? null, size: v.size ?? null, sha256: v.sha256 ?? null,
  url: v.url ?? null, receivedAt: v.receivedAt, late: !!v.late,
});

export const presentItems = (items = []) =>
  DELIVERABLE_KINDS.map((kind) => {
    const versions = items.find((i) => i.kind === kind)?.versions ?? [];
    const current = versions.at(-1);
    return {
      kind,
      count: versions.length,
      current: current ? publicVersion(current) : null,
      history: versions.slice(0, -1).reverse().map(publicVersion), // F5.5
    };
  });

// Règles par livrable, avec la fenêtre de dépôt propre à chaque type
export const publicRules = (edition, now = new Date()) =>
  Object.fromEntries(
    DELIVERABLE_KINDS.map((k) => {
      const { exts, maxMb, link, required } = DELIVERABLES[k];
      const win = getWindow(edition, now, k);
      return [k, {
        exts, maxMb, link, required,
        window: { state: win.state, deadline: win.deadline, closesAt: win.closesAt, canDeposit: win.canDeposit },
      }];
    })
  );

export const neutralName = (anonCode, kind, version) =>
  `${anonCode}_${kind}_v${version.version}${path.extname(version.fileName)}`;