import path from "node:path";
import fs from "node:fs";
import fsp from "node:fs/promises";

// Dev : dossier local "uploads" (cwd). Prod : volume Coolify, ex. UPLOAD_ROOT=/data/uploads.
const fromEnv = process.env.UPLOAD_ROOT?.trim();
export const UPLOAD_ROOT = fromEnv ? path.resolve(fromEnv) : path.resolve("uploads");
export const PRIVATE_DIR = path.join(UPLOAD_ROOT, "private");      // pièces justificatives
export const PUBLIC_DIR = path.join(UPLOAD_ROOT, "public");          // fichiers publics
export const LOGO_DIR = path.join(PUBLIC_DIR, "logos");       // logos des équipes
export const SPONSOR_DIR = path.join(PUBLIC_DIR, "sponsors"); // logos des partenaires (F1.5)
export const POSTER_DIR = path.join(PUBLIC_DIR, "posters");   // affiches des éditions (F1.1)
export const RULES_DIR = path.join(PUBLIC_DIR, "rules");       // règlement en PDF (F3.1)
export const JURY_DIR = path.join(PUBLIC_DIR, "jury");         // photos des membres du jury (F3.6)
export const SUBJECT_DIR = path.join(PRIVATE_DIR, "subject");  // documents du sujet (F4.1) : jamais servis en statique
export const SUBMISSIONS_DIR = path.join(PRIVATE_DIR, "submissions");
export const NEWS_VIDEO_DIR = path.join(PUBLIC_DIR, "news-videos");
export const EDITION_VIDEO_DIR = path.join(PUBLIC_DIR, "edition-videos");
export const ORGANIZATION_DIR = path.join(PUBLIC_DIR, "organization");
export const EVENT_SPONSOR_DIR = path.join(PUBLIC_DIR, "event-sponsors");

const UPLOAD_DIRS = [
  LOGO_DIR, SPONSOR_DIR, POSTER_DIR, RULES_DIR, JURY_DIR,
  NEWS_VIDEO_DIR, EDITION_VIDEO_DIR, ORGANIZATION_DIR, EVENT_SPONSOR_DIR,
  PRIVATE_DIR, SUBJECT_DIR, SUBMISSIONS_DIR,
];

// Crée l'arborescence et vérifie que le processus peut y écrire (volume monté, bon utilisateur).
export function ensureUploadDirs() {
  if (process.env.NODE_ENV === "production" && !fromEnv) {
    console.warn(
      "UPLOAD_ROOT n'est pas défini. Les fichiers restent dans le conteneur et seront perdus au redéploiement. " +
      "Dans Coolify, montez un volume sur /data/uploads et définissez UPLOAD_ROOT=/data/uploads."
    );
  }
  for (const dir of UPLOAD_DIRS) fs.mkdirSync(dir, { recursive: true });
  fs.accessSync(UPLOAD_ROOT, fs.constants.W_OK);
}

// Supprime un fichier sans planter s'il n'existe plus
export async function removeFile(absPath) {
  if (!absPath) return;
  try {
    await fsp.unlink(absPath);
  } catch (err) {
    if (err.code !== "ENOENT") console.error("Suppression impossible :", err.message);
  }
}

export const privatePath = (fileName) => path.join(PRIVATE_DIR, path.basename(fileName));

// F4.1 : nom de fichier -> chemin absolu dans uploads/private/subject
export const subjectFilePath = (fileName) => path.join(SUBJECT_DIR, path.basename(fileName));

// "/uploads/logos/abc.png" -> chemin absolu sur le disque
export const logoPath = (publicUrl) =>
  publicUrl ? path.join(LOGO_DIR, path.basename(publicUrl)) : null;

// Version générale : "/uploads/<dossier>/abc.png" -> chemin absolu sur le disque
export const publicPath = (publicUrl) => {
  if (!publicUrl?.startsWith("/uploads/")) return null;
  const [folder, file] = publicUrl.replace("/uploads/", "").split("/");
  return path.join(PUBLIC_DIR, path.basename(folder), path.basename(file || ""));
};