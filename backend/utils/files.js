import path from "node:path";
import fs from "node:fs/promises";

// Dossier racine des fichiers envoyés
export const UPLOAD_ROOT = path.resolve("uploads");
export const PRIVATE_DIR = path.join(UPLOAD_ROOT, "private");      // pièces justificatives
export const PUBLIC_DIR = path.join(UPLOAD_ROOT, "public");          // fichiers publics
export const LOGO_DIR = path.join(PUBLIC_DIR, "logos");       // logos des équipes
export const SPONSOR_DIR = path.join(PUBLIC_DIR, "sponsors"); // logos des partenaires (F1.5)
export const POSTER_DIR = path.join(PUBLIC_DIR, "posters");   // affiches des éditions (F1.1)
export const RULES_DIR = path.join(PUBLIC_DIR, "rules");       // règlement en PDF (F3.1)
export const JURY_DIR = path.join(PUBLIC_DIR, "jury");         // photos des membres du jury (F3.6)
export const SUBJECT_DIR = path.join(PRIVATE_DIR, "subject");  // documents du sujet (F4.1) : jamais servis en statique

// Supprime un fichier sans planter s'il n'existe plus
export async function removeFile(absPath) {
  if (!absPath) return;
  try {
    await fs.unlink(absPath);
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