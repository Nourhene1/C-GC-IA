import News from "../models/News.js";
import Team from "../models/Team.js";
import User from "../models/User.js";
import { sendMailSafe } from "./mailer.js";
import { newsMail } from "./emailTemplates.js";

// F1.4 : envoie par email les annonces publiées dont la date est atteinte
// et qui n'ont pas encore été notifiées. Appelée :
//  - juste après une publication (envoi immédiat)
//  - chaque minute par le planificateur (publications différées, F1.6)
export async function runNewsNotifications() {
  const due = await News.find({
    published: true,
    publishAt: { $lte: new Date() },
    notifyTeams: true,
    notifiedAt: null,
  }).select("_id");

  for (const { _id } of due) {
    // On "réserve" l'annonce avant d'envoyer : si deux traitements tournent
    // en même temps, un seul obtient l'annonce et les emails ne partent qu'une fois.
    const news = await News.findOneAndUpdate(
      { _id, notifiedAt: null },
      { notifiedAt: new Date() },
      { new: true }
    );
    if (!news) continue;

    // Équipes inscrites à l'édition (sauf dossiers rejetés)
    const teams = await Team.find({ edition: news.edition, status: { $ne: "rejete" } })
      .select("members.email")
      .lean();
    const emails = [...new Set(teams.flatMap((t) => t.members.map((m) => m.email)))];
    if (emails.length === 0) continue;

    const users = await User.find({ email: { $in: emails } }).select("email locale").lean();
    const localeOf = Object.fromEntries(users.map((u) => [u.email, u.locale]));
    const link = `${process.env.FRONTEND_URL}/news/${news._id}`;

    for (const email of emails) {
      await sendMailSafe({ to: email, ...newsMail({ news, locale: localeOf[email] || "fr", link }) });
    }
    console.log(`📣 Annonce « ${news.title.fr} » envoyée à ${emails.length} personne(s)`);
  }
}

export function startNewsScheduler() {
  const tick = () => runNewsNotifications().catch((err) => console.error("Notifications :", err.message));
  tick();
  return setInterval(tick, 60 * 1000); // toutes les minutes
}
