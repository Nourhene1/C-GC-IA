// Emails du Module 6
import { build } from "./emailTemplates.js";

// F6.2 : des équipes viennent d'être affectées à un évaluateur
export function assignmentMail({ name, count, locale, link }) {
  const fr = {
    subject: "Nouvelles évaluations à réaliser — Compétition IA & Génie Civil",
    title: `Bonjour ${name},`,
    lines: [
      count > 1
        ? `${count} nouveaux travaux vous ont été attribués pour évaluation.`
        : "Un nouveau travail vous a été attribué pour évaluation.",
      "Connectez-vous à votre espace jury pour consulter les livrables et saisir vos notes.",
    ],
    button: { label: "Voir mes évaluations", url: link },
  };
  const en = {
    subject: "New evaluations to complete — AI & Civil Engineering Competition",
    title: `Hello ${name},`,
    lines: [
      count > 1
        ? `${count} new projects have been assigned to you for evaluation.`
        : "A new project has been assigned to you for evaluation.",
      "Sign in to your jury space to view the deliverables and enter your scores.",
    ],
    button: { label: "View my evaluations", url: link },
  };
  return build(locale, locale === "en" ? en : fr);
}

// F6.5 : l'admin a rouvert une évaluation déjà validée
export function reopenedMail({ name, reason, locale, link }) {
  const fr = {
    subject: "Une évaluation a été rouverte",
    title: `Bonjour ${name},`,
    lines: [
      "Le comité d'organisation a rouvert une de vos évaluations pour que vous puissiez la corriger.",
      `Motif : ${reason}`,
      "Après correction, pensez à la valider de nouveau.",
    ],
    button: { label: "Voir mes évaluations", url: link },
  };
  const en = {
    subject: "An evaluation has been reopened",
    title: `Hello ${name},`,
    lines: [
      "The organising committee has reopened one of your evaluations so that you can correct it.",
      `Reason: ${reason}`,
      "Once corrected, remember to submit it again.",
    ],
    button: { label: "View my evaluations", url: link },
  };
  return build(locale, locale === "en" ? en : fr);
}
