import User from "../models/User.js";
import { sendMailSafe } from "./mailer.js";
import { statusMail } from "./emailTemplates.js";

// F2.7 : prévient tous les membres de l'équipe du nouveau statut du dossier
export async function notifyStatus(team) {
  const emails = team.members.map((m) => m.email);
  const users = await User.find({ email: { $in: emails } }).select("email locale").lean();
  const localeOf = Object.fromEntries(users.map((u) => [u.email, u.locale]));

  await Promise.all(
    emails.map((email) => {
      const locale = localeOf[email] || "fr";
      return sendMailSafe({
        to: email,
        ...statusMail({
          teamName: team.name,
          status: team.status,
          reason: team.rejectionReason,
          locale,
          link: `${process.env.FRONTEND_URL}/team`,
        }),
      });
    })
  );
}
