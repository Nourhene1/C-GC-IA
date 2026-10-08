import Team from "../models/Team.js";
import User from "../models/User.js";
import { getCurrentEdition, isRegistrationOpen } from "../utils/edition.js";
import { getChecklist, isChecklistOk } from "../utils/checklist.js";
import { sendMailSafe } from "../utils/mailer.js";
import { invitationMail } from "../utils/emailTemplates.js";
import { notifyStatus } from "../utils/notify.js";
import { removeFile, privatePath, logoPath } from "../utils/files.js";

const FRONT = () => process.env.FRONTEND_URL;
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Un nom d'équipe est-il déjà pris dans cette édition ? (sans tenir compte des majuscules)
async function nameTaken(editionId, name, exceptId = null) {
  return Team.exists({
    edition: editionId,
    name: new RegExp(`^${escapeRegex(name.trim())}$`, "i"),
    ...(exceptId && { _id: { $ne: exceptId } }),
  });
}

// Ce que le frontend reçoit : l'équipe sans les noms de fichiers internes
function serializeTeam(team) {
  const obj = team.toObject();
  obj.documents = obj.documents.map(({ fileName, ...doc }) => doc);
  return obj;
}

// ---------------------------------------------------------------------------
// F2.2 — Créer et consulter l'équipe
// ---------------------------------------------------------------------------

// POST /api/teams
export const createTeam = async (req, res) => {
  const edition = await getCurrentEdition();
  if (!isRegistrationOpen(edition)) {
    return res.status(403).json({ code: "REGISTRATION_CLOSED" });
  }
  if (req.user.team) return res.status(409).json({ code: "ALREADY_IN_TEAM" });

  const { name, etablissement, filiere, coach = {}, niveau = "" } = req.body;
  if (!name?.trim() || !etablissement?.trim() || !filiere?.trim()) {
    return res.status(400).json({ code: "FIELDS_REQUIRED" });
  }
  if (await nameTaken(edition._id, name)) {
    return res.status(409).json({ code: "TEAM_NAME_TAKEN" });
  }

  const user = req.user;
  const team = await Team.create({
    edition: edition._id,
    name,
    etablissement,
    filiere,
    coach: { nom: coach.nom || "", email: coach.email || "" },
    chef: user._id,
    // Le chef est le premier membre de l'équipe
  members: [{
      user: user._id,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      etablissement,
      niveau,
      filiere,
      isChef: true,
    }],
    history: [{ status: "brouillon", by: user._id }],
  });

  user.team = team._id;
  await user.save();

  res.status(201).json({ team: serializeTeam(team) });
};

// GET /api/teams/me — F2.8 : tableau de bord de l'équipe (chef et membres)
export const getMyTeam = async (req, res) => {
  if (!req.user.team) return res.json({ team: null });

  const team = await Team.findById(req.user.team)
    .populate("edition", "year teamSize dates requiredDocuments")
    .populate("members.user", "isVerified");
  if (!team) return res.json({ team: null });

  res.json({
    team: serializeTeam(team),
    checklist: getChecklist(team, team.edition),
    editable: team.isEditable(),
    registrationOpen: isRegistrationOpen(team.edition),
    now: new Date(),
  });
};

// PUT /api/teams/me — modifier les informations de l'équipe
export const updateTeam = async (req, res) => {
  const team = req.team;
  const { name, etablissement, filiere, coach = {} } = req.body;

  if (!name?.trim() || !etablissement?.trim() || !filiere?.trim()) {
    return res.status(400).json({ code: "FIELDS_REQUIRED" });
  }
  if (await nameTaken(team.edition._id, name, team._id)) {
    return res.status(409).json({ code: "TEAM_NAME_TAKEN" });
  }

  Object.assign(team, { name, etablissement, filiere });
  team.coach = { nom: coach.nom || "", email: coach.email || "" };
  await team.save();

  res.json({ team: serializeTeam(team) });
};

// POST /api/teams/me/logo — champ "file"
export const updateLogo = async (req, res) => {
  if (!req.file) return res.status(400).json({ code: "FILE_REQUIRED" });

  const team = req.team;
  await removeFile(logoPath(team.logo)); // on supprime l'ancien logo
  team.logo = `/uploads/logos/${req.file.filename}`;
  await team.save();

  res.json({ logo: team.logo });
};

// DELETE /api/teams/me/logo
export const deleteLogo = async (req, res) => {
  const team = req.team;
  await removeFile(logoPath(team.logo));
  team.logo = null;
  await team.save();
  res.json({ logo: null });
};

// ---------------------------------------------------------------------------
// F2.3 — Membres
// ---------------------------------------------------------------------------

// Envoie l'email d'invitation (lien d'activation, ou lien de connexion si le compte existe)
async function sendInvitation(user, team, chef) {
  const needsActivation = !user.isVerified;
  let link = `${FRONT()}/login`;
  if (needsActivation) {
    const token = user.createEmailToken(24 * 7);
    await user.save();
    link = `${FRONT()}/activate?token=${token}`;
  }

  await sendMailSafe({
    to: user.email,
    ...invitationMail({
      member: user,
      teamName: team.name,
      chefName: `${chef.prenom} ${chef.nom}`,
      link,
      locale: user.locale,
      needsActivation,
    }),
  });
}

// POST /api/teams/me/members
export const addMember = async (req, res) => {
  const team = req.team;
  const { nom, prenom, etablissement, niveau, filiere } = req.body;
  const email = String(req.body.email || "").toLowerCase().trim();

  if (
    !nom?.trim() ||
    !prenom?.trim() ||
    !email ||
    !etablissement?.trim() ||
    !niveau?.trim() ||
    !filiere?.trim()
  ) {
    return res.status(400).json({ code: "FIELDS_REQUIRED" });
  }
  if (team.members.length >= team.edition.teamSize.max) {
    return res.status(400).json({ code: "TEAM_FULL", params: { max: team.edition.teamSize.max } });
  }
  if (team.members.some((m) => m.email === email)) {
    return res.status(409).json({ code: "MEMBER_EXISTS" });
  }

  // Le compte existe déjà ?
  let user = await User.findOne({ email });
  if (user && (user.team || user.role !== "membre")) {
    // Déjà dans une équipe, ou compte chef / jury / admin
    return res.status(409).json({ code: "MEMBER_EMAIL_TAKEN" });
  }

  if (user) {
    user.team = team._id;
  } else {
    // Nouveau compte sans mot de passe : le membre l'activera via l'email
    user = new User({ nom, prenom, email, role: "membre", team: team._id, locale: req.user.locale });
  }
  await user.save();

  team.members.push({ user: user._id, nom, prenom, email, etablissement, niveau, filiere });
  await team.save();

  await sendInvitation(user, team, req.user);

  res.status(201).json({ member: team.members.at(-1) });
};

// PUT /api/teams/me/members/:memberId — l'email ne se modifie pas
export const updateMember = async (req, res) => {
  const team = req.team;
  const member = team.members.id(req.params.memberId);
  if (!member) return res.status(404).json({ code: "NOT_FOUND" });

  const { nom, prenom, niveau, filiere } = req.body;
  if (!nom?.trim() || !prenom?.trim() || !niveau?.trim() || !filiere?.trim()) {
    return res.status(400).json({ code: "FIELDS_REQUIRED" });
  }

  Object.assign(member, { nom, prenom, niveau, filiere });
  await team.save();

  // On garde le nom du compte synchronisé
  if (member.user) await User.updateOne({ _id: member.user }, { nom, prenom });

  res.json({ member });
};

// DELETE /api/teams/me/members/:memberId
export const removeMember = async (req, res) => {
  const team = req.team;
  const member = team.members.id(req.params.memberId);
  if (!member) return res.status(404).json({ code: "NOT_FOUND" });
  if (member.isChef) return res.status(400).json({ code: "CANNOT_REMOVE_CHEF" });

  // On supprime aussi les pièces justificatives de ce membre
  const docs = team.documents.filter((d) => String(d.member) === String(member._id));
  await Promise.all(docs.map((d) => removeFile(privatePath(d.fileName))));
  team.documents = team.documents.filter((d) => String(d.member) !== String(member._id));

  // Compte jamais activé : on le supprime. Sinon, on le détache de l'équipe.
  if (member.user) {
    const user = await User.findById(member.user).select("+password");
    if (user && !user.password) await user.deleteOne();
    else if (user) {
      user.team = null;
      await user.save();
    }
  }

  team.members = team.members.filter((m) => String(m._id) !== String(member._id));
  await team.save();

  res.json({ ok: true });
};

// POST /api/teams/me/members/:memberId/resend — renvoyer l'invitation
export const resendInvitation = async (req, res) => {
  const team = req.team;
  const member = team.members.id(req.params.memberId);
  if (!member?.user || member.isChef) return res.status(404).json({ code: "NOT_FOUND" });

  const user = await User.findById(member.user);
  if (!user) return res.status(404).json({ code: "NOT_FOUND" });

  await sendInvitation(user, team, req.user);
  res.json({ ok: true });
};

// ---------------------------------------------------------------------------
// F2.4 — Pièces justificatives
// ---------------------------------------------------------------------------

// POST /api/teams/me/documents — champs "file", "kind", "memberId" (si par membre)
export const uploadDocument = async (req, res) => {
  const team = req.team;
  const file = req.file;
  if (!file) return res.status(400).json({ code: "FILE_REQUIRED" });

  const fail = async (status, code) => {
    await removeFile(file.path); // on ne garde pas un fichier refusé
    return res.status(status).json({ code });
  };

  const { kind, memberId } = req.body;
  const requirement = team.edition.requiredDocuments.find((r) => r.kind === kind);
  if (!requirement) return fail(400, "INVALID_DOCUMENT_KIND");

  let member = null;
  if (requirement.perMember) {
    member = team.members.id(memberId);
    if (!member) return fail(400, "MEMBER_REQUIRED");
  }

  // Une seule pièce par type (et par membre) : on remplace l'ancienne
  const sameSlot = (d) =>
    d.kind === kind && String(d.member || "") === String(member?._id || "");
  const old = team.documents.find(sameSlot);
  if (old) {
    await removeFile(privatePath(old.fileName));
    team.documents = team.documents.filter((d) => !sameSlot(d));
  }

  team.documents.push({
    kind,
    member: member?._id || null,
    fileName: file.filename,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
  });
  await team.save();

  const { fileName, ...doc } = team.documents.at(-1).toObject();
  res.status(201).json({ document: doc });
};

// DELETE /api/teams/me/documents/:docId
export const deleteDocument = async (req, res) => {
  const team = req.team;
  const doc = team.documents.id(req.params.docId);
  if (!doc) return res.status(404).json({ code: "NOT_FOUND" });

  await removeFile(privatePath(doc.fileName));
  team.documents = team.documents.filter((d) => String(d._id) !== String(doc._id));
  await team.save();

  res.json({ ok: true });
};

// GET /api/teams/:teamId/documents/:docId — consulter une pièce
// Accessible à l'admin et aux membres de l'équipe uniquement
export const downloadDocument = async (req, res) => {
  const team = await Team.findById(req.params.teamId).select("documents");
  if (!team) return res.status(404).json({ code: "NOT_FOUND" });

  const isAdmin = req.user.role === "admin";
  const isInTeam = String(req.user.team) === String(team._id);
  if (!isAdmin && !isInTeam) return res.status(403).json({ code: "FORBIDDEN" });

  const doc = team.documents.id(req.params.docId);
  if (!doc) return res.status(404).json({ code: "NOT_FOUND" });

  res.setHeader("Content-Type", doc.mimeType || "application/octet-stream");
  res.setHeader(
    "Content-Disposition",
    `inline; filename*=UTF-8''${encodeURIComponent(doc.originalName)}`
  );
  res.sendFile(privatePath(doc.fileName));
};

// ---------------------------------------------------------------------------
// Soumission du dossier
// ---------------------------------------------------------------------------

// POST /api/teams/me/submit
export const submitTeam = async (req, res) => {
  const team = req.team;

  if (!["brouillon", "en_revision"].includes(team.status)) {
    return res.status(400).json({ code: "ALREADY_SUBMITTED" });
  }
  // Une première soumission doit se faire pendant la période d'inscription.
  // Un dossier renvoyé "en révision" peut être corrigé après la clôture.
  if (team.status === "brouillon" && !isRegistrationOpen(team.edition)) {
    return res.status(403).json({ code: "REGISTRATION_CLOSED" });
  }

  const checklist = getChecklist(team, team.edition);
  if (!isChecklistOk(checklist)) {
    return res.status(400).json({ code: "DOSSIER_INCOMPLETE", checklist });
  }

  team.setStatus("en_attente", req.user._id);
  team.submittedAt = new Date();
  await team.save();

  await notifyStatus(team);

  res.json({ team: serializeTeam(team) });
};
