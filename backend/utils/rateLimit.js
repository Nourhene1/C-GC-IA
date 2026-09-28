// Limiteur très simple, en mémoire : au plus `max` requêtes par adresse IP
// pendant `windowMs`. Suffisant pour protéger le formulaire de contact des abus.
export function rateLimit({ max, windowMs }) {
  const hits = new Map(); // ip -> liste des dates d'appel

  return (req, res, next) => {
    const now = Date.now();
    const ip = req.ip;
    const recent = (hits.get(ip) || []).filter((t) => now - t < windowMs);

    if (recent.length >= max) {
      return res.status(429).json({ code: "TOO_MANY_REQUESTS" });
    }
    recent.push(now);
    hits.set(ip, recent);

    // Nettoyage de temps en temps pour ne pas garder toutes les IP en mémoire
    if (hits.size > 5000) {
      for (const [key, list] of hits) {
        if (list.every((t) => now - t >= windowMs)) hits.delete(key);
      }
    }
    next();
  };
}
