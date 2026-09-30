// Emails du module 4. Nécessite `export` devant `function build` dans emailTemplates.js
import { build } from "./emailTemplates.js";

// F4.6 : le sujet est ouvert
export function subjectOpenMail({ locale, link }) {
  const fr = {
    subject: "Le sujet de la compétition est disponible",
    title: "Le sujet est ouvert",
    lines: [
      "La session de compétition vient d'ouvrir : le sujet est maintenant disponible.",
      "Connectez-vous à votre espace équipe pour le consulter et le télécharger.",
    ],
    button: { label: "Accéder au sujet", url: link },
  };
  const en = {
    subject: "The competition subject is now available",
    title: "The subject is now open",
    lines: [
      "The competition session has just opened: the subject is now available.",
      "Sign in to your team space to view and download it.",
    ],
    button: { label: "Access the subject", url: link },
  };
  return build(locale, locale === "en" ? en : fr);
}

// F4.7 : addendum publié
export function addendumMail({ addendum, locale, link }) {
  const title = (locale === "en" && addendum.title.en) || addendum.title.fr;
  const content = (locale === "en" && addendum.content.en) || addendum.content.fr;
  const preview = content.length > 400 ? `${content.slice(0, 400)}…` : content;
  const fr = {
    subject: `Addendum au sujet : ${title}`,
    title,
    lines: [...preview.split(/\n+/)],
    button: { label: "Voir l'addendum", url: link },
  };
  const en = {
    subject: `Subject addendum: ${title}`,
    title,
    lines: [...preview.split(/\n+/)],
    button: { label: "View the addendum", url: link },
  };
  return build(locale, locale === "en" ? en : fr);
}