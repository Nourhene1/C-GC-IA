import fs from "fs";
import path from "path";
import crypto from "crypto";
import multer from "multer";
import { DELIVERABLES } from "../utils/submissionConfig.js";
import { SUBMISSION_DIR, getWindow } from "../utils/submissions.js";
import { audit } from "../utils/audit.js";

fs.mkdirSync(SUBMISSION_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, SUBMISSION_DIR),
  filename: (_req, file, cb) =>
    cb(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`),
});

// Un uploader par type : chacun a sa propre limite de taille et ses extensions (F5.4)
const uploaders = Object.fromEntries(
  Object.entries(DELIVERABLES).map(([kind, rule]) => [
    kind,
    multer({
      storage,
      limits: { fileSize: rule.maxMb * 1024 * 1024, files: 1 },
      fileFilter: (_req, file, cb) =>
        rule.exts.includes(path.extname(file.originalname).toLowerCase())
          ? cb(null, true)
          : cb(new Error("INVALID_FORMAT")),
    }).single("file"),
  ])
);

// Refuse tout de suite (avant de recevoir le fichier) si la fenêtre est fermée
export const requireDepositWindow = async (req, res, next) => {
  const win = getWindow(req.edition);
  if (win.canDeposit) return next();

  await audit(req, "SUBMISSION_REJECTED", { meta: { kind: req.params.kind, reason: win.state } });
  res.status(403).json({ code: "SUBMISSIONS_CLOSED", closesAt: win.closesAt });
};

export const uploadDeliverable = (req, res, next) => {
  const rule = DELIVERABLES[req.params.kind];
  if (!rule) return res.status(400).json({ code: "INVALID_KIND" });

  uploaders[req.params.kind](req, res, (err) => {
    if (!err) return next();
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ code: "FILE_TOO_LARGE", maxMb: rule.maxMb });
    }
    if (err.message === "INVALID_FORMAT") {
      return res.status(415).json({ code: "INVALID_FORMAT", allowed: rule.exts });
    }
    next(err);
  });
};