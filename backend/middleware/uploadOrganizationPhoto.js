
import fs from "fs";
import path from "path";
import crypto from "crypto";
import multer from "multer";
import { PUBLIC_DIR } from "../utils/files.js";

const DIR = path.join(PUBLIC_DIR, "organization");
fs.mkdirSync(DIR, { recursive: true });

const ALLOWED = [".png", ".jpg", ".jpeg", ".webp"];

const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
];

export const uploadOrganizationPhoto = multer({
  storage: multer.diskStorage({
    destination: DIR,
    filename: (req, file, cb) =>
      cb(
        null,
        `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`
      ),
  }),

  limits: { fileSize: 2 * 1024 * 1024 },

  fileFilter: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();

    const validExtension = ALLOWED.includes(extension);
    const validMimeType = ALLOWED_MIME_TYPES.includes(file.mimetype);

    if (validExtension && validMimeType) {
      return cb(null, true);
    }

    return cb(
      Object.assign(new Error("INVALID_FILE_TYPE"), { status: 400 })
    );
  },
}).single("photo");
