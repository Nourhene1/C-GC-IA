// Données de DÉMONSTRATION pour tester le Module 1 (archives, actualités, sponsors).
// ⚠ Contenus fictifs : supprime-les depuis l'espace admin avant la mise en ligne.
import "dotenv/config";
import mongoose from "mongoose";
import Edition from "../models/Edition.js";
import News from "../models/News.js";

await mongoose.connect(process.env.MONGO_URI);

// Une édition passée pour la page "Archives"
const past = (await Edition.findOne({ year: 2025 })) || new Edition();
past.set({
  year: 2025,
  isCurrent: false,
  title: { fr: "Compétition IA & Génie Civil — Édition 2025", en: "AI & Civil Engineering Competition — 2025 Edition" },
  theme: { fr: "Édition de démonstration", en: "Demo edition" },
  dates: {
    registrationOpen:   new Date("2025-10-01T08:00:00+01:00"),
    registrationClose:  new Date("2025-10-31T23:59:00+01:00"),
    sessionOpen:        new Date("2025-11-15T09:00:00+01:00"),
    submissionDeadline: new Date("2025-11-16T17:00:00+01:00"),
  },
  subjectSummary: {
    fr: "Exemple de résumé du sujet : remplace ce texte par le vrai sujet de l'édition.",
    en: "Sample subject summary: replace this text with the real subject of the edition.",
  },
  winners: [
    { rank: 1, teamName: "Équipe exemple A", etablissement: "Établissement exemple" },
    { rank: 2, teamName: "Équipe exemple B", etablissement: "Établissement exemple" },
    { rank: 3, teamName: "Équipe exemple C", etablissement: "Établissement exemple" },
  ],
});
await past.save();

// Une annonce de lancement pour l'édition en cours
const current = await Edition.findOne({ isCurrent: true });
if (current && !(await News.exists({ edition: current._id }))) {
  await News.create({
    edition: current._id,
    category: "lancement",
    title: { fr: "Lancement de l'édition 2026", en: "Launch of the 2026 edition" },
    content: {
      fr: "Les inscriptions à la Compétition IA & Génie Civil sont ouvertes !\n\nFormez votre équipe et inscrivez-vous avant la date de clôture.",
      en: "Registration for the AI & Civil Engineering Competition is open!\n\nForm your team and register before the closing date.",
    },
    published: true,
    publishAt: new Date(),
  });
}

console.log("Données de démonstration créées");
await mongoose.disconnect();
