// utils/deadlines.js
// Date limite de dépôt de chaque livrable.
//  - report / code  -> dates.submissionDeadline
//  - video          -> dates.videoDeadline        (repli : submissionDeadline)
//  - slides         -> dates.presentationDeadline (repli : resultsDate, ancien comportement)

export const KINDS = ["report", "code", "slides", "video"];

// Date limite officielle d'un livrable (sans tolérance)
export function deadlineFor(edition, kind) {
  const d = edition?.dates || {};
  switch (kind) {
    case "video":
      return d.videoDeadline || d.submissionDeadline || null;
    case "slides":
      return d.presentationDeadline || d.resultsDate || null;
    case "report":
    case "code":
    default:
      return d.submissionDeadline || null;
  }
}

export function closeAtFor(edition, kind) {
  const deadline = deadlineFor(edition, kind);
  if (!deadline) return null;
  // Repli sur resultsDate (présentation sans date propre) : pas de tolérance
  const usesResultsFallback = kind === "slides" && !edition?.dates?.presentationDeadline;
  const tolerance = usesResultsFallback ? 0 : Number(edition?.submission?.toleranceMinutes) || 0;
  return new Date(new Date(deadline).getTime() + tolerance * 60 * 1000);
}

// État du dépôt pour un livrable : "open" | "grace" | "closed"
export function windowStateFor(edition, kind, now = new Date()) {
  const deadline = deadlineFor(edition, kind);
  const closeAt = closeAtFor(edition, kind);
  if (!deadline || !closeAt) return "closed";

  const t = new Date(now).getTime();
  if (t <= new Date(deadline).getTime()) return "open";
  if (t <= closeAt.getTime()) return "grace";
  return "closed";
}

// Un dépôt fait maintenant serait-il en retard ?
export function isLateFor(edition, kind, now = new Date()) {
  return windowStateFor(edition, kind, now) === "grace";
}

// Toutes les échéances d'une édition, par livrable (pratique pour l'API et l'affichage)
export function allDeadlines(edition) {
  return Object.fromEntries(
    KINDS.map((kind) => [
      kind,
      {
        deadline: deadlineFor(edition, kind),
        closeAt: closeAtFor(edition, kind),
      },
    ])
  );
}