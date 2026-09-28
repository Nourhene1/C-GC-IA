import Team from "../models/Team.js";

// Charge l'équipe de l'utilisateur connecté dans req.team
export const loadMyTeam = async (req, res, next) => {
  if (!req.user.team) return res.status(404).json({ code: "NO_TEAM" });

  const team = await Team.findById(req.user.team).populate("edition");
  if (!team) return res.status(404).json({ code: "NO_TEAM" });

  req.team = team;
  next();
};

// Bloque les modifications quand le dossier est validé ou rejeté (F2.8)
export const requireEditable = (req, res, next) => {
  if (!req.team.isEditable()) {
    return res.status(403).json({ code: "TEAM_LOCKED" });
  }
  next();
};
