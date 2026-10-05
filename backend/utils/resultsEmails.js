// Emails du Module 7
import { build } from "./emailTemplates.js";

// F7.4 / F7.6 : résultats publiés (+ attestation en pièce jointe)
// Le rang n'est mentionné QUE pour les équipes récompensées (award = true).
// Toutes les autres reçoivent un message de remerciement pour leur participation.
export function resultsMail({ name, teamName, rank, award, withCertificate, locale, link }) {
  const showRank = Boolean(award && rank);

  const fr = {
    subject: "Les résultats de la Compétition IA & Génie Civil sont publiés",
    title: `Bonjour ${name},`,
    lines: [
      "Le classement officiel de la compétition vient d'être publié.",
      showRank
        ? `Félicitations ! Votre équipe « ${teamName} » termine à la ${rank === 1 ? "1re" : `${rank}e`} place.`
        : `Merci pour la participation de votre équipe « ${teamName} ».`,
      ...(withCertificate
        ? [showRank
            ? "Vous trouverez votre certificat de récompense en pièce jointe (PDF)."
            : "Vous trouverez votre attestation de participation en pièce jointe (PDF)."]
        : []),
    ],
    button: { label: "Voir le classement", url: link },
  };

  const ordinalEn = (n) => {
    const s = ["th", "st", "nd", "rd"], v = n % 100;
    return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
  };

  const en = {
    subject: "The AI & Civil Engineering Competition results are out",
    title: `Hello ${name},`,
    lines: [
      "The official ranking of the competition has just been published.",
      showRank
        ? `Congratulations! Your team "${teamName}" won ${ordinalEn(rank)} place.`
        : `Thank you for your team "${teamName}"'s participation.`,
      ...(withCertificate
        ? [showRank
            ? "Your certificate of achievement is attached (PDF)."
            : "Your certificate of participation is attached (PDF)."]
        : []),
    ],
    button: { label: "View the ranking", url: link },
  };

  return build(locale, locale === "en" ? en : fr);
}