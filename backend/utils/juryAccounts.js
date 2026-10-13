// Comptes du personnel d'évaluation : jury et pilotage.
// L'admin saisit les membres dans l'onglet Contenu. Chaque membre ayant un email
// reçoit un compte (sans mot de passe) et un lien d'activation valable 7 jours.
import User from "../models/User.js";
import { sendMailSafe } from "./mailer.js";
import { juryInvitationMail } from "./emailTemplates.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLES = ["jury", "pilotage"];
const ERROR_PREFIX = { jury: "JURY", pilotage: "PILOTAGE" };

const normalize = (email) => String(email || "").toLowerCase().trim();

// "Ahmed Ben Salah" -> prénom "Ahmed", nom "Ben Salah"
// (le prénom et le nom sont obligatoires dans User, on prévoit une valeur de secours)
function splitName(full) {
  const parts = String(full || "").trim().split(/\s+/).filter(Boolean);
  const prenom = parts[0] || "Membre";
  return { prenom, nom: parts.slice(1).join(" ") || prenom };
}

// Vérifie les emails des DEUX listes AVANT d'enregistrer quoi que ce soit.
// Renvoie un code d'erreur ou null.
export async function checkStaffEmails({ jury = [], pilotage = [] }) {
  // Un pilote sans email ne peut pas recevoir son lien d'activation
  if (pilotage.some((m) => !normalize(m.email))) return "PILOTAGE_EMAIL_REQUIRED";

  const byRole = {
    jury: jury.map((m) => normalize(m.email)).filter(Boolean),
    pilotage: pilotage.map((m) => normalize(m.email)),
  };
  const all = [...byRole.jury, ...byRole.pilotage];

  if (all.some((e) => !EMAIL_RE.test(e))) return "INVALID_EMAIL";
  // Même email saisi deux fois, dans la même liste ou dans les deux listes
  if (new Set(all).size !== all.length) return "EMAIL_DUPLICATE";

  // Un email déjà utilisé par un compte d'un AUTRE rôle (chef, membre, admin,
  // ou l'autre liste) est refusé
  for (const role of ROLES) {
    const emails = byRole[role];
    if (emails.length && (await User.exists({ email: { $in: emails }, role: { $ne: role } }))) {
      return `${ERROR_PREFIX[role]}_EMAIL_TAKEN`;
    }
  }
  return null;
}

// Crée un nouveau lien (7 jours) et envoie l'email d'invitation
export async function sendInvitation(user, name) {
  const token = user.createEmailToken(24 * 7);
  await user.save();
  const link = `${process.env.FRONTEND_URL}/activate?token=${token}`;
  await sendMailSafe({
    to: user.email,
    ...juryInvitationMail({ name, link, locale: user.locale, role: user.role }),
  });
}

// Relie chaque membre qui a un email à un compte du rôle donné (créé si besoin).
// Modifie la liste (champ user) et renvoie les invitations à envoyer
// APRÈS l'enregistrement du contenu.
export async function linkAccounts(list, previous = [], role) {
  // Membres déjà liés avant cette sauvegarde : on ne leur renvoie pas d'invitation
  const wasLinked = new Set(previous.filter((p) => p.user).map((p) => String(p.user)));
  const invitations = [];

  for (const member of list) {
    member.email = normalize(member.email);
    member.user = null; // on ne fait jamais confiance au "user" envoyé par le navigateur
    if (!member.email) continue;

    let user = await User.findOne({ email: member.email });

    if (!user) {
      user = new User({
        ...splitName(member.name),
        email: member.email,
        role,
        isVerified: false,
      });
      await user.save();
      invitations.push({ user, name: member.name });
    } else if (!user.isVerified && !wasLinked.has(String(user._id))) {
      // Compte jamais activé et email tout juste saisi : on envoie une invitation
      invitations.push({ user, name: member.name });
    }

    member.user = user._id;
  }
  return invitations;
}

// Supprime les comptes retirés de la liste qui n'ont jamais été activés.
// Un compte déjà activé est conservé.
export async function removeUnusedAccounts(list, previous = [], role) {
  const kept = new Set(list.filter((m) => m.user).map((m) => String(m.user)));
  const removed = previous
    .filter((p) => p.user && !kept.has(String(p.user)))
    .map((p) => p.user);

  if (removed.length) {
    await User.deleteMany({ _id: { $in: removed }, role, isVerified: false });
  }
}

// Ajoute l'état du compte à chaque membre de jury ET de pilotage pour l'écran admin :
// null (pas de compte), "invited" (invitation envoyée), "active" (compte activé)
export async function withStaffStatus(content) {
  const obj = content.toObject ? content.toObject() : { ...content };

  const members = [...(obj.jury || []), ...(obj.pilotage || [])];
  const ids = members.map((m) => m.user).filter(Boolean);
  const users = await User.find({ _id: { $in: ids } }).select("isVerified").lean();
  const verified = new Map(users.map((u) => [String(u._id), u.isVerified]));

  const withStatus = (m) => {
    if (!m.user || !verified.has(String(m.user))) return { ...m, account: null };
    return { ...m, account: verified.get(String(m.user)) ? "active" : "invited" };
  };

  obj.jury = (obj.jury || []).map(withStatus);
  obj.pilotage = (obj.pilotage || []).map(withStatus);
  return obj;
}