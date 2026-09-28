import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Team from "../models/Team.js";
import { sendMailSafe } from "../utils/mailer.js";
import { verifyEmailMail } from "../utils/emailTemplates.js";
import { getCurrentEdition, isRegistrationOpen } from "../utils/edition.js";

const pickLocale = (l) => (l === "en" ? "en" : "fr");

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });

// Ce qu'on renvoie au frontend (jamais le mot de passe ni les jetons)
export const publicUser = (user) => ({
  id: user._id,
  nom: user.nom,
  prenom: user.prenom,
  email: user.email,
  role: user.role,
  team: user.team || null,
  locale: user.locale,
});

const session = (user) => ({ token: signToken(user), user: publicUser(user) });

// Crée un jeton de confirmation (24 h), enregistre l'utilisateur et envoie l'email
async function sendVerification(user) {
  const token = user.createEmailToken(24);
  await user.save();
  const link = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  await sendMailSafe({ to: user.email, ...verifyEmailMail(user, link) });
}

// POST /api/auth/register — F2.1 : le chef crée le compte de son équipe
export const register = async (req, res) => {
  const { nom, prenom, email, password, locale } = req.body;

  if (!nom || !prenom || !email || !password) {
    return res.status(400).json({ code: "FIELDS_REQUIRED" });
  }
  if (password.length < 8) {
    return res.status(400).json({ code: "PASSWORD_TOO_SHORT" });
  }

  // F2.5 : pas de nouvelle inscription hors période
  const edition = await getCurrentEdition();
  if (!isRegistrationOpen(edition)) {
    return res.status(403).json({ code: "REGISTRATION_CLOSED" });
  }

  const exists = await User.exists({ email: email.toLowerCase().trim() });
  if (exists) return res.status(409).json({ code: "EMAIL_TAKEN" });

  // Le rôle est imposé : on ne lit JAMAIS req.body.role
  const user = new User({
    nom,
    prenom,
    email,
    password,
    role: "chef",
    locale: pickLocale(locale),
    isVerified: false,
  });
  await sendVerification(user);

  res.status(201).json({ code: "VERIFY_EMAIL_SENT", email: user.email });
};

// POST /api/auth/verify-email — clic sur le lien reçu par email
export const verifyEmail = async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ code: "INVALID_TOKEN" });

  // Seuls les comptes qui ont déjà un mot de passe passent par ici
  const user = await User.findByEmailToken(token, { password: { $exists: true } });
  if (!user) return res.status(400).json({ code: "INVALID_TOKEN" });

  user.isVerified = true;
  user.clearEmailToken();
  await user.save();

  // Connexion automatique après confirmation
  res.json(session(user));
};

// POST /api/auth/resend-verification
export const resendVerification = async (req, res) => {
  const email = String(req.body.email || "").toLowerCase().trim();
  const user = await User.findOne({ email, isVerified: false, password: { $exists: true } });
  if (user) await sendVerification(user);

  // Même réponse que le compte existe ou non : on ne révèle pas les emails inscrits
  res.json({ code: "VERIFY_EMAIL_SENT" });
};

// POST /api/auth/login
export const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ code: "CREDENTIALS_REQUIRED" });
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ code: "INVALID_CREDENTIALS" });
  }
  if (!user.isVerified) {
    return res.status(403).json({ code: "EMAIL_NOT_VERIFIED" });
  }

  res.json(session(user));
};

// GET /api/auth/invitation/:token — infos affichées sur la page d'activation
export const getInvitation = async (req, res) => {
  const user = await User.findByEmailToken(req.params.token, { password: { $exists: false } });
  if (!user) return res.status(400).json({ code: "INVALID_TOKEN" });

  const team = user.team ? await Team.findById(user.team).select("name").lean() : null;
  res.json({ prenom: user.prenom, email: user.email, teamName: team?.name || "" });
};

// POST /api/auth/activate — F2.3 : le membre invité choisit son mot de passe
export const activate = async (req, res) => {
  const { token, password, locale } = req.body;
  if (!token || !password) return res.status(400).json({ code: "FIELDS_REQUIRED" });
  if (password.length < 8) return res.status(400).json({ code: "PASSWORD_TOO_SHORT" });

  const user = await User.findByEmailToken(token, { password: { $exists: false } });
  if (!user) return res.status(400).json({ code: "INVALID_TOKEN" });

  user.password = password;
  user.isVerified = true;
  if (locale) user.locale = pickLocale(locale);
  user.clearEmailToken();
  await user.save();

  res.json(session(user));
};

// GET /api/auth/me
export const me = (req, res) => {
  res.json({ user: publicUser(req.user) });
};
