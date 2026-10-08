import multer from "multer";
import crypto from "crypto";
import fs from "fs";
import { NEWS_VIDEO_DIR } from "../utils/video.js";

const EXTENSIONS = {
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/quicktime": ".mov",
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdirSync(NEWS_VIDEO_DIR, { recursive: true });
    cb(null, NEWS_VIDEO_DIR);
  },
  filename: (req, file, cb) => {
    cb(null, `${crypto.randomUUID()}${EXTENSIONS[file.mimetype]}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200 Mo → FILE_TOO_LARGE géré par server.js
  fileFilter: (req, file, cb) => {
    if (!EXTENSIONS[file.mimetype]) {
      const err = new Error("Type de fichier non autorisé");
      err.code = "INVALID_FILE_TYPE";
      return cb(err);
    }
    cb(null, true);
  },
}).single("video");

// Le formulaire envoie les champs texte dans "payload" (JSON)
function parseNewsPayload(req, res, next) {
  if (typeof req.body?.payload === "string") {
    try {
      req.body = JSON.parse(req.body.payload);
    } catch {
      return res.status(400).json({ code: "VALIDATION_ERROR" });
    }
  }
  next();
}

export const newsVideoUpload = [upload, parseNewsPayload];