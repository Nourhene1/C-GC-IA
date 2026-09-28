import ContactMessage from "../models/ContactMessage.js";
import User from "../models/User.js";
import { sendMailSafe } from "../utils/mailer.js";
import { contactMail } from "../utils/emailTemplates.js";

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/contact — F3.4 : formulaire public
export const sendContact = async (req, res) => {
  const { name, email, subject, message, website } = req.body;

  // Champ piège invisible pour les humains : s'il est rempli, c'est un robot.
  // On répond "OK" sans rien enregistrer pour ne pas l'aider.
  if (website) return res.status(201).json({ ok: true });

  if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
    return res.status(400).json({ code: "FIELDS_REQUIRED" });
  }
  if (!EMAIL_RX.test(email.trim())) return res.status(400).json({ code: "INVALID_EMAIL" });

  const msg = await ContactMessage.create({ name, email, subject, message });

  // Destinataire : CONTACT_EMAIL du .env, sinon tous les administrateurs
  const to = process.env.CONTACT_EMAIL
    || (await User.find({ role: "admin" }).select("email").lean()).map((u) => u.email).join(",");
  if (to) await sendMailSafe({ to, ...contactMail(msg) });

  res.status(201).json({ ok: true });
};

// GET /api/admin/messages?unread=1
export const listMessages = async (req, res) => {
  const filter = req.query.unread === "1" ? { read: false } : {};
  const [messages, unread] = await Promise.all([
    ContactMessage.find(filter).sort({ createdAt: -1 }).limit(200).lean(),
    ContactMessage.countDocuments({ read: false }),
  ]);
  res.json({ messages, unread });
};

// PATCH /api/admin/messages/:id — { read: true | false }
export const markMessage = async (req, res) => {
  const msg = await ContactMessage.findByIdAndUpdate(req.params.id, { read: Boolean(req.body.read) }, { new: true });
  if (!msg) return res.status(404).json({ code: "NOT_FOUND" });
  res.json({ message: msg });
};

// DELETE /api/admin/messages/:id
export const deleteMessage = async (req, res) => {
  const msg = await ContactMessage.findByIdAndDelete(req.params.id);
  if (!msg) return res.status(404).json({ code: "NOT_FOUND" });
  res.json({ ok: true });
};
