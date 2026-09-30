import Subject from "../models/Subject.js";
import Team from "../models/Team.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import { sendMailSafe } from "./mailer.js";
import { subjectOpenMail } from "./subjectEmails.js";

// Notifie (in-app + email) toutes les équipes VALIDÉES d'une édition
export async function notifyValidatedTeams(edition, { type, title, body, path, mail }) {
  const teams = await Team.find({ edition: edition._id, status: "valide" }).select("members.email").lean();
  const emails = [...new Set(teams.flatMap((t) => t.members.map((m) => m.email)))];
  if (emails.length === 0) return 0;

  const users = await User.find({ email: { $in: emails } }).select("email locale").lean();
  const localeOf = Object.fromEntries(users.map((u) => [u.email, u.locale]));

  if (users.length) {
    await Notification.insertMany(users.map((u) => ({ user: u._id, type, title, body, link: path })));
  }
  for (const email of emails) {
    await sendMailSafe({ to: email, ...mail(localeOf[email] || "fr") });
  }
  return emails.length;
}

// F4.6 : à l'heure d'ouverture, prévient les équipes (une seule fois).
// L'ACCÈS au sujet, lui, ne dépend pas de ce planificateur : il est vérifié à chaque requête.
export async function runSubjectNotifications() {
  const now = new Date();
  const pending = await Subject.find({ notifiedAt: null, "files.0": { $exists: true } })
    .populate("edition")
    .select("_id edition");

  for (const s of pending) {
    const edition = s.edition;
    if (!edition?.isCurrent || edition.dates.sessionOpen > now) continue;

    // Réservation atomique : un seul traitement envoie les notifications
    const claimed = await Subject.findOneAndUpdate({ _id: s._id, notifiedAt: null }, { notifiedAt: now });
    if (!claimed) continue;

    const link = `${process.env.FRONTEND_URL}/team/subject`;
    const count = await notifyValidatedTeams(edition, {
      type: "subject_open",
      title: { fr: "Le sujet est disponible", en: "The subject is now available" },
      body: {
        fr: "La session est ouverte. Téléchargez le sujet depuis votre espace équipe.",
        en: "The session is open. Download the subject from your team space.",
      },
      path: "/team/subject",
      mail: (locale) => subjectOpenMail({ locale, link }),
    });
    console.log(`📂 Sujet ${edition.year} publié : ${count} personne(s) notifiée(s)`);
  }
}

export function startSubjectScheduler() {
  const tick = () => runSubjectNotifications().catch((err) => console.error("Notif sujet :", err.message));
  tick();
  return setInterval(tick, 60 * 1000);
}