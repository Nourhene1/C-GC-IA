// Fonctions partagées par les contrôleurs du Module 6
import EvaluationGrid from "../models/EvaluationGrid.js";
import Evaluation from "../models/Evaluation.js";
import Submission from "../models/Submission.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { sendMailSafe } from "./mailer.js";
import { assignmentMail } from "./evaluationEmails.js";
import { STAGES } from "./stages.js";

// Grille d'une édition pour une étape. Créée si absente, en une seule opération atomique.
export async function getGrid(edition, stage = "final") {
  const filter = { edition: edition._id, stage };

  const existing = await EvaluationGrid.findOne(filter);
  if (existing) return existing;

  try {
    return await EvaluationGrid.create({ ...filter, criteria: [] });
  } catch (err) {
    if (err.code !== 11000) throw err;

    // Création simultanée : la grille existe déjà, on la relit
    const again = await EvaluationGrid.findOne(filter);
    if (again) return again;

    // Sinon, un index obsolète bloque la création
    console.error("Index bloquant sur evaluationgrids :", err.keyPattern);
    throw new Error(`Création de la grille impossible (stage=${stage}), index bloquant : ${JSON.stringify(err.keyPattern)}`);
  }
}

// Une fois qu'une évaluation de l'étape a été validée, sa grille ne peut plus changer
export const isGridLocked = (edition, stage = "final") =>
  Evaluation.exists({ edition: edition._id, stage, submittedAt: { $ne: null } }).then(Boolean);

// Équipes à évaluer : celles qui ont déposé au moins un livrable
export async function evaluableSubmissions(edition) {
  const subs = await Submission.find({ edition: edition._id }).populate("team", "name etablissement").lean();
  return subs.filter((s) => s.team && s.items.some((i) => i.versions.length > 0));
}

// Prévient chaque évaluateur de ses nouvelles affectations (in-app + email)
export async function notifyAssignments(created, stage = "final") {
  const countBy = new Map();
  for (const a of created) countBy.set(String(a.evaluator), (countBy.get(String(a.evaluator)) || 0) + 1);
  if (countBy.size === 0) return;

  const { base } = STAGES[stage];
  const users = await User.find({ _id: { $in: [...countBy.keys()] } }).select("prenom nom email locale").lean();
  const link = `${process.env.FRONTEND_URL}${base}`;

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
        link: base,
      };
    })
  );
  for (const u of users) {
    await sendMailSafe({
      to: u.email,
      ...assignmentMail({
        name: `${u.prenom} ${u.nom}`, count: countBy.get(String(u._id)), locale: u.locale, link, stage,
      }),
    });
  }
}