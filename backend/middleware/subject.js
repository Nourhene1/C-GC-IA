import Team from "../models/Team.js";
import { getCurrentEdition } from "../utils/edition.js";
import { audit } from "../utils/audit.js";

// F4.2 + F4.3 : contrôle d'accès CÔTÉ SERVEUR au sujet.
// À placer après `protect`. Charge req.edition (et req.team pour les équipes).
//  - admin : accès permanent (préparation, aperçu)
//  - jury  : accès après l'ouverture
//  - chef / membre : équipe VALIDÉE et heure d'ouverture atteinte
// L'heure utilisée est celle du serveur, jamais celle du navigateur.
export const subjectAccess = async (req, res, next) => {
  const now = new Date();
  let edition;
  let bypassDate = false;

  if (req.user.role === "admin") {
    edition = await getCurrentEdition();
    bypassDate = true;
  } else if (req.user.role === "jury") {
    edition = await getCurrentEdition();
  } else {
    if (!req.user.team) return res.status(404).json({ code: "NO_TEAM" });
    const team = await Team.findById(req.user.team).populate("edition");
    if (!team) return res.status(404).json({ code: "NO_TEAM" });
    req.team = team;

    if (team.status !== "valide") {
      await audit(req, "SUBJECT_ACCESS_DENIED", { meta: { reason: "TEAM_NOT_VALIDATED" } });
      return res.status(403).json({ code: "TEAM_NOT_VALIDATED" });
    }
    edition = team.edition;
  }

  if (!edition) return res.status(404).json({ code: "NO_EDITION" });

  if (!bypassDate && now < edition.dates.sessionOpen) {
    await audit(req, "SUBJECT_ACCESS_DENIED", { meta: { reason: "SUBJECT_NOT_OPEN" } });
    return res.status(403).json({ code: "SUBJECT_NOT_OPEN", opensAt: edition.dates.sessionOpen, now });
  }

  req.edition = edition;
  next();
};