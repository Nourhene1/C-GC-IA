import mongoose from "mongoose";

// Un texte dans les deux langues
const localized = {
  fr: { type: String, required: true, trim: true },
  en: { type: String, default: "", trim: true },
};

// Une pièce justificative demandée (F2.4)
const requiredDocumentSchema = new mongoose.Schema(
  {
    kind: { type: String, required: true }, // "carte_etudiant", "attestation_scolarite"…
    perMember: { type: Boolean, default: true }, // une par membre, ou une seule pour l'équipe
  },
  { _id: false }
);

// Une équipe primée (historique des éditions)
const winnerSchema = new mongoose.Schema(
  {
    rank: { type: Number, required: true, min: 1 },
    teamName: { type: String, required: true, trim: true },
    etablissement: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const editionSchema = new mongoose.Schema(
  {
    year: { type: Number, required: true, unique: true },
    title: localized,
    theme: localized,
    isCurrent: { type: Boolean, default: false },

    dates: {
      registrationOpen: { type: Date, required: true },
      registrationClose: { type: Date, required: true },
      sessionOpen: { type: Date, required: true },
      submissionDeadline: { type: Date, required: true },
      evaluationStart: { type: Date }, // F3.2 : phase d'évaluation par le jury
      evaluationEnd: { type: Date },
      resultsDate: { type: Date },
    },

    // Nombre de membres autorisé, chef compris (F2.3)
    teamSize: {
      min: { type: Number, default: 2, min: 1 },
      max: { type: Number, default: 5, min: 1 },
    },

    submission: {
      toleranceMinutes: { type: Number, default: 0, min: 0, max: 240 }, // F5.2
      anonymize: { type: Boolean, default: false },              // F5.8
    },

    // Module 7 : règles du classement et de la publication des résultats
    results: {
      tieBreakers: { type: [String], default: ["lowestGap", "earliestSubmission"] }, // F7.2 : départage, dans l'ordre
      podiumSize:  { type: Number, default: 3, min: 1, max: 10 },  // F7.5 : nombre d'équipes sur le podium
      showScores:  { type: Boolean, default: true },               // notes visibles sur la page publique
      sendCertificates: { type: Boolean, default: true },          // F7.6 : attestations envoyées par email à la publication
    },

    requiredDocuments: {
      type: [requiredDocumentSchema],
      default: [
        { kind: "carte_etudiant", perMember: true },
        { kind: "attestation_scolarite", perMember: true }
      ],
    },

    // Chiffres de l'édition précédente, affichés sur l'accueil (F1.1)
    stats: {
      teams: { type: Number, default: 0 },
      participants: { type: Number, default: 0 },
      schools: { type: Number, default: 0 },
    },

    // --- Historique (F1.1) : rempli à la fin de l'édition ---
    poster: { type: String, default: null }, // affiche : /uploads/posters/xxx.jpg
    subjectSummary: {
      fr: { type: String, trim: true, default: "" },
      en: { type: String, trim: true, default: "" },
    },
    winners: [winnerSchema],
  },
  { timestamps: true }
);

// Refuse une édition incohérente
editionSchema.pre("validate", function () {
  const d = this.dates;
  if (d.registrationOpen >= d.registrationClose) {
    this.invalidate("dates.registrationClose", "La clôture doit suivre l'ouverture des inscriptions");
  }
  if (d.sessionOpen >= d.submissionDeadline) {
    this.invalidate("dates.submissionDeadline", "La date limite doit suivre l'ouverture du sujet");
  }
  if (d.evaluationStart && d.evaluationEnd && d.evaluationStart >= d.evaluationEnd) {
    this.invalidate("dates.evaluationEnd", "La fin de l'évaluation doit suivre son début");
  }
  if (this.teamSize.min > this.teamSize.max) {
    this.invalidate("teamSize.max", "Le maximum doit être supérieur ou égal au minimum");
  }
});

export default mongoose.model("Edition", editionSchema);
