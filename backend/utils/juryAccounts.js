// Comptes des membres du jury : l'admin saisit un email dans l'onglet Jury,
// on crée un compte "jury" sans mot de passe et on envoie un lien d'activation.
import User from "../models/User.js";
import { sendMailSafe } from "./mailer.js";
import { juryInvitationMail } from "./emailTemplates.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const normalize = (email) => String(email || "").toLowerCase().trim();

// "Ahmed Ben Salah" -> prénom "Ahmed", nom "Ben Salah"
function splitName(full) {
  const parts = full.trim().split(/\s+/);
  return { prenom: parts[0], nom: parts.slice(1).join(" ") || parts[0] };
}

// Vérifie les emails AVANT d'enregistrer quoi que ce soit. Renvoie un code d'erreur ou null.
export async function checkJuryEmails(jury) {
  const emails = jury.map((j) => normalize(j.email)).filter(Boolean);
  if (emails.some((e) => !EMAIL_RE.test(e))) return "INVALID_EMAIL";
  if (new Set(emails).size !== emails.length) return "JURY_EMAIL_DUPLICATE";
  // Un chef, un membre ou un admin ne peut pas devenir juré avec le même email
  if (await User.exists({ email: { $in: emails }, role: { $ne: "jury" } })) return "JURY_EMAIL_TAKEN";
  return null;
}

// Crée un nouveau lien (7 jours) et envoie l'email d'invitation
export async function sendJuryInvitation(user, name) {
  const token = user.createEmailToken(24 * 7);
  await user.save();
  const link = `${process.env.FRONTEND_URL}/activate?token=${token}`;
  await sendMailSafe({ to: user.email, ...juryInvitationMail({ name, link, locale: user.locale }) });
}

// Relie chaque juré qui a un email à un compte "jury" (créé si besoin).
// Modifie la liste `jury` (champ user) et renvoie les invitations à envoyer
// APRÈS l'enregistrement du contenu.
export async function linkJuryAccounts(jury, previousJury = []) {
  const wasLinked = new Set(previousJury.map((p) => String(p.user)).filter((id) => id !== "null"));
  const invitations = [];

  for (const member of jury) {
    member.email = normalize(member.email);
    member.user = null; // on ne fait jamais confiance au "user" envoyé par le navigateur
    if (!member.email) continue;

    let user = await User.findOne({ email: member.email });
    if (!user) {
      user = new User({ ...splitName(member.name), email: member.email, role: "jury", isVerified: false });
      await user.save();
      invitations.push({ user, name: member.name });
    } else if (!user.isVerified && !wasLinked.has(String(user._id))) {
      // compte jamais activé et email tout juste saisi : on renvoie une invitation
      invitations.push({ user, name: member.name });
    }
    member.user = user._id;
  }
  return invitations;
}

// Supprime les comptes jury retirés de la liste qui n'avaient jamais été activés.
// Un compte déjà activé est conservé.
export async function removeUnusedJuryAccounts(jury, previousJury = []) {
  const kept = new Set(jury.map((j) => String(j.user)));
  const removed = previousJury.map((p) => p.user).filter((id) => id && !kept.has(String(id)));
  if (removed.length) {
    await User.deleteMany({ _id: { $in: removed }, role: "jury", isVerified: false });
  }
}

// Ajoute l'état du compte à chaque juré pour l'écran admin :
// null (pas d'email), "invited" (invitation envoyée), "active" (compte activé)
export async function withJuryStatus(content) {
  const obj = content.toObject ? content.toObject() : content;
  const ids = (obj.jury || []).map((j) => j.user).filter(Boolean);
  const users = await User.find({ _id: { $in: ids } }).select("isVerified").lean();
  const verified = new Map(users.map((u) => [String(u._id), u.isVerified]));

  obj.jury = (obj.jury || []).map((j) => {
    const key = String(j.user);
    const account = verified.has(key) ? (verified.get(key) ? "active" : "invited") : null;
    return { ...j, account };
  });
  return obj;
}