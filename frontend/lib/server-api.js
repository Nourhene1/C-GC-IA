// Appels à l'API depuis les composants SERVEUR (pages publiques).
// Renvoie null au lieu de planter si l'API est injoignable ou répond une erreur :
// la page s'affiche quand même, sans cette partie.
export async function serverApi(path) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export const publicFileUrl = (path) => (path ? `${process.env.NEXT_PUBLIC_API_URL}${path}` : null);
