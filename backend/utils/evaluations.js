// Fonctions partagées par les contrôleurs du Module 6
import EvaluationGrid from "../models/EvaluationGrid.js";
import Evaluation from "../models/Evaluation.js";
import Submission from "../models/Submission.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { sendMailSafe } from "./mailer.js";
import { assignmentMail } from "./evaluationEmails.js";

// Grille de l'édition (créée vide la première fois)
export async function getGrid(edition) {
  return (
    (await EvaluationGrid.findOne({ edition: edition._id })) ||
    EvaluationGrid.create({ edition: edition._id, criteria: [] })
  );
}

// F6.5 : dès qu'une évaluation a été validée une fois, la grille ne peut plus changer
// (sinon les notes déjà données ne voudraient plus rien dire)
export const isGridLocked = (edition) =>
  Evaluation.exists({ edition: edition._id, submittedAt: { $ne: null } }).then(Boolean);

// Équipes à évaluer : celles qui ont déposé au moins un livrable
export async function evaluableSubmissions(edition) {
  const subs = await Submission.find({ edition: edition._id }).populate("team", "name etablissement").lean();
  return subs.filter((s) => s.team && s.items.some((i) => i.versions.length > 0));
}

// F6.2 : prévient chaque évaluateur de ses nouvelles affectations (in-app + email)
export async function notifyAssignments(created) {
  const countBy = new Map();
  for (const a of created) countBy.set(String(a.evaluator), (countBy.get(String(a.evaluator)) || 0) + 1);
  if (countBy.size === 0) return;

  const users = await User.find({ _id: { $in: [...countBy.keys()] } }).select("prenom nom email locale").lean();
  const link = `${process.env.FRONTEND_URL}/jury/evaluations`;

  await Notification.insertMany(
    users.map((u) => {
      const n = countBy.get(String(u._id));
      return {
        user: u._id,
        type: "evaluation_assigned",
        title: { fr: "Nouvelles évaluations", en: "New evaluations" },
        body: {
          fr: n > 1 ? `${n} travaux vous ont été attribués.` : "Un travail vous a été attribué.",
          en: n > 1 ? `${n} projects have been assigned to you.` : "A project has been assigned to you.",
        },
        link: "/jury/evaluations",
      };
    })
  );
  for (const u of users) {
    await sendMailSafe({
      to: u.email,
      ...assignmentMail({ name: `${u.prenom} ${u.nom}`, count: countBy.get(String(u._id)), locale: u.locale, link }),
    });
  }
}
