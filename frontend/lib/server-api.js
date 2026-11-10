// Adresse interne du backend : utilisée uniquement côté serveur
const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;

// Appels à l'API depuis les composants SERVEUR (pages publiques).
// Renvoie null au lieu de planter si l'API est injoignable ou répond une erreur :
// la page s'affiche quand même, sans cette partie.
export async function serverApi(path) {
  try {
    const res = await fetch(`${API_URL}${path}`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// Fichiers publics servis via le proxy Next.js (/files/...) :
// le navigateur ne voit jamais l'adresse du backend
export const publicFileUrl = (path) => {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path; // déjà une URL complète (ex. CDN)
  return `/files${path.startsWith("/") ? path : `/${path}`}`;
};