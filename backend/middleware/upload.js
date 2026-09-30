import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { PRIVATE_DIR, LOGO_DIR, SPONSOR_DIR, POSTER_DIR, RULES_DIR, JURY_DIR, SUBJECT_DIR } from "../utils/files.js";

const MB = 1024 * 1024;

// Crée un middleware d'envoi d'un seul fichier (champ "file")
function makeUpload({ dir, types, maxMb }) {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    // Nom aléatoire : on ne garde jamais le nom choisi par l'utilisateur sur le disque
    filename: (req, file, cb) => {
      cb(null, crypto.randomUUID() + path.extname(file.originalname).toLowerCase());
    },
  });

  return multer({
    storage,
    limits: { fileSize: maxMb * MB, files: 1 },
    fileFilter: (req, file, cb) => {
      // Multer lit le nom du fichier en latin1 : on le repasse en UTF-8
      // pour garder les accents ("Règlement.pdf" et non "RÃ¨glement.pdf")
      file.originalname = Buffer.from(file.originalname, "latin1").toString("utf8");
      const ext = path.extname(file.originalname).toLowerCase();
      // L'extension ET le type annoncé doivent correspondre à la liste autorisée
      // (une extension peut accepter plusieurs types MIME : ex. .zip)
      const allowed = [].concat(types[ext] ?? []);
      if (!allowed.includes(file.mimetype)) {
        const err = new Error("INVALID_FILE_TYPE");
        err.code = "INVALID_FILE_TYPE";
        return cb(err);
      }
      cb(null, true);
    },
  }).single("file");
}

// F2.4 : pièces justificatives -> PDF, JPG ou PNG, 5 Mo par défaut
export const uploadDocument = makeUpload({
  dir: PRIVATE_DIR,
  types: {
    ".pdf": "application/pdf",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
  },
  maxMb: Number(process.env.MAX_UPLOAD_MB) || 5,
});

const IMAGE_TYPES = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

// F2.2 : logo de l'équipe -> image de 2 Mo maximum
export const uploadLogo = makeUpload({ dir: LOGO_DIR, types: IMAGE_TYPES, maxMb: 2 });

// F1.5 : logo d'un partenaire / sponsor
export const uploadSponsorLogo = makeUpload({ dir: SPONSOR_DIR, types: IMAGE_TYPES, maxMb: 2 });

// F1.1 : affiche d'une édition (historique)
export const uploadPoster = makeUpload({ dir: POSTER_DIR, types: IMAGE_TYPES, maxMb: 5 });

// F3.1 : règlement officiel en PDF (public, téléchargeable)
export const uploadRulesPdf = makeUpload({ dir: RULES_DIR, types: { ".pdf": "application/pdf" }, maxMb: 10 });

// F3.6 : photo d'un membre du jury
export const uploadJuryPhoto = makeUpload({ dir: JURY_DIR, types: IMAGE_TYPES, maxMb: 2 });

// F4.1 : documents du sujet (privés, jamais servis en statique)
export const uploadSubjectFile = makeUpload({
  dir: SUBJECT_DIR,
  types: {
    ".pdf": "application/pdf",
    ".zip": ["application/zip", "application/x-zip-compressed"],
    ".csv": ["text/csv", "application/vnd.ms-excel"],
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".txt": "text/plain",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
  },
  maxMb: Number(process.env.MAX_SUBJECT_MB) || 50,
});