import fs from "fs";
import path from "path";
import { PUBLIC_DIR } from "./files.js";

export const NEWS_VIDEO_DIR = path.join(PUBLIC_DIR, "news-videos");
export const EDITION_VIDEO_DIR = path.join(PUBLIC_DIR, "edition-videos");

const YOUTUBE_ID = /^[\w-]{11}$/;
const VIMEO_ID = /^\d+$/;

// Accepte un lien YouTube ou Vimeo (https) et renvoie { url, provider, videoId }.
// Champ vide : { url: "", provider: "", videoId: "" }. Lien non reconnu : null.
export function parseVideoUrl(raw = "") {
  const value = String(raw).trim();
  if (!value) return { url: "", provider: "", videoId: "" };

  let u;
  try {
    u = new URL(value);
  } catch {
    return null;
  }
  if (u.protocol !== "https:") return null;

  const host = u.hostname.replace(/^www\./, "");
  const segments = u.pathname.split("/").filter(Boolean);

  if (host === "youtube.com" || host === "m.youtube.com") {
    const id = u.searchParams.get("v") || (segments[0] === "embed" ? segments[1] : null);
    if (YOUTUBE_ID.test(id || "")) return { url: value, provider: "youtube", videoId: id };
  }

  if (host === "youtu.be") {
    const id = segments[0];
    if (YOUTUBE_ID.test(id || "")) return { url: value, provider: "youtube", videoId: id };
  }

  if (host === "vimeo.com") {
    const id = segments[segments.length - 1];
    if (VIMEO_ID.test(id || "")) return { url: value, provider: "vimeo", videoId: id };
  }

  return null;
}

async function removeFromDir(dir, filename) {
  if (!filename) return;
  await fs.promises.unlink(path.join(dir, path.basename(filename))).catch(() => {});
}

// Actualités
export const removeStoredVideo = (filename) => removeFromDir(NEWS_VIDEO_DIR, filename);
export const discardUpload = (file) => (file ? removeStoredVideo(file.filename) : undefined);

// Éditions
export const removeStoredEditionVideo = (filename) => removeFromDir(EDITION_VIDEO_DIR, filename);
export const discardEditionUpload = (file) => (file ? removeStoredEditionVideo(file.filename) : undefined);

// Supprime tous les fichiers envoyés pour une édition (en cas d'erreur)
export async function discardEditionFiles(files = []) {
  await Promise.all(files.map((f) => removeStoredEditionVideo(f.filename)));
}