import multer from "multer";
import crypto from "crypto";
import fs from "fs";
import { EDITION_VIDEO_DIR } from "../utils/video.js";

const EXTENSIONS = {
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/quicktime": ".mov",
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdirSync(EDITION_VIDEO_DIR, { recursive: true });
    cb(null, EDITION_VIDEO_DIR);
  },
  filename: (req, file, cb) => {
    cb(null, `${crypto.randomUUID()}${EXTENSIONS[file.mimetype]}`);
  },
});

// Champs acceptés : "video" (vidéo de l'édition) et "winnerVideo_<index>" (vidéo d'une équipe)
const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const validName = file.fieldname === "video" || /^winnerVideo_\d+$/.test(file.fieldname);
    if (!validName || !EXTENSIONS[file.mimetype]) {
      const err = new Error("Type de fichier non autorisé");
      err.code = "INVALID_FILE_TYPE";
      return cb(err);
    }
    cb(null, true);
  },
}).any();

// Les champs texte arrivent dans "payload" (JSON)
function parseEditionPayload(req, res, next) {
  if (typeof req.body?.payload === "string") {
    try {
      req.body = JSON.parse(req.body.payload);
    } catch {
      return res.status(400).json({ code: "VALIDATION_ERROR" });
    }
  }
  next();
}

export const editionVideoUpload = [upload, parseEditionPayload];