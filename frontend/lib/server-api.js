export async function serverApi(path) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// Transforme n'importe quel chemin stocké en base en "/uploads/<dossier>/<fichier>"
// servi par Next (proxy vers le backend, voir next.config.mjs).
export const publicFileUrl = (path) => {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path; // déjà une URL complète

  const clean = String(path)
    .replace(/\\/g, "/")          // chemins Windows
    .replace(/^\/+/, "")          // slash initial
    .replace(/^uploads\//, "")    // "uploads/..."
    .replace(/^public\//, "");    // "public/..."

  return `/uploads/${clean}`;
};