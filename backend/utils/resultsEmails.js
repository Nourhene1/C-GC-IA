// Emails du Module 7
import { build } from "./emailTemplates.js";

// F7.4 / F7.6 : résultats publiés (+ attestation en pièce jointe)
export function resultsMail({ name, teamName, rank, award, withCertificate, locale, link }) {
  const fr = {
    subject: "Les résultats de la Compétition IA & Génie Civil sont publiés",
    title: `Bonjour ${name},`,
    lines: [
      "Le classement officiel de la compétition vient d'être publié.",
      rank
        ? award
          ? `Félicitations ! Votre équipe « ${teamName} » termine à la ${rank === 1 ? "1re" : `${rank}e`} place.`
          : `Votre équipe « ${teamName} » termine à la ${rank === 1 ? "1re" : `${rank}e`} place.`
        : `Merci pour la participation de votre équipe « ${teamName} ».`,
      ...(withCertificate ? ["Vous trouverez votre attestation en pièce jointe (PDF)."] : []),
    ],
    button: { label: "Voir le classement", url: link },
  };
  const en = {
    subject: "The AI & Civil Engineering Competition results are out",
    title: `Hello ${name},`,
    lines: [
      "The official ranking of the competition has just been published.",
      rank
        ? award
          ? `Congratulations! Your team "${teamName}" finished in position ${rank}.`
          : `Your team "${teamName}" finished in position ${rank}.`
        : `Thank you for your team "${teamName}"'s participation.`,
      ...(withCertificate ? ["Your certificate is attached (PDF)."] : []),
    ],
    button: { label: "View the ranking", url: link },
  };
  return build(locale, locale === "en" ? en : fr);
}
