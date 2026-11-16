import mongoose from "mongoose";

// Un texte dans les deux langues (obligatoire en français)
const localized = {
  fr: { type: String, required: true, trim: true },
  en: { type: String, default: "", trim: true },
};

// Un texte bilingue facultatif
const optionalText = {
  fr: { type: String, trim: true, default: "" },
  en: { type: String, trim: true, default: "" },
};

// Vidéo : fichier importé, lien YouTube ou lien Vimeo
const videoSchema = new mongoose.Schema(
  {
    url: { type: String, default: "" },
    provider: { type: String, enum: ["", "youtube", "vimeo", "file"], default: "" },
    videoId: { type: String, default: "" }, // nom du fichier si provider = "file"
  },
  { _id: false }
);

// Une pièce justificative demandée (F2.4)
const requiredDocumentSchema = new mongoose.Schema(
  {
    kind: { type: String, required: true },
    perMember: { type: Boolean, default: true },
  },
  { _id: false }
);

// Une équipe primée, avec sa vidéo facultative
const winnerSchema = new mongoose.Schema(
  {
    rank: { type: Number, required: true, min: 1 },
    teamName: { type: String, required: true, trim: true },
    etablissement: { type: String, trim: true, default: "" },
    video: { type: videoSchema, default: () => ({}) },
  },
  { _id: false }
);

// Témoignage d'un ancien participant
const testimonialSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    role: optionalText,
    quote: optionalText,
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
      submissionDeadline: { type: Date, required: true }, // rapport + code source
      videoDeadline: { type: Date },                      // vidéo
      presentationDeadline: { type: Date },               // présentation
      evaluationStart: { type: Date },
      evaluationEnd: { type: Date },
      resultsDate: { type: Date },
    },

    teamSize: {
      min: { type: Number, default: 2, min: 1 },
      max: { type: Number, default: 5, min: 1 },
    },

    submission: {
      toleranceMinutes: { type: Number, default: 0, min: 0, max: 240 },
      anonymize: { type: Boolean, default: false },
    },

    results: {
      tieBreakers: { type: [String], default: ["lowestGap", "earliestSubmission"] },
      podiumSize: { type: Number, default: 3, min: 1, max: 10 },
      showScores: { type: Boolean, default: true },
      sendCertificates: { type: Boolean, default: true },
    },

    requiredDocuments: {
      type: [requiredDocumentSchema],
      default: [
        { kind: "carte_etudiant", perMember: true },
        { kind: "attestation_scolarite", perMember: true },
      ],
    },

    stats: {
      teams: { type: Number, default: 0 },
      participants: { type: Number, default: 0 },
      schools: { type: Number, default: 0 },
    },

    // Historique (F1.1)
    poster: { type: String, default: null },
    subjectSummary: optionalText,
    winners: [winnerSchema],
    video: { type: videoSchema, default: () => ({}) },
    testimonials: [testimonialSchema],
  },
  { timestamps: true }
);

// Refuse une édition incohérente
editionSchema.pre("validate", function () {
  const d = this.dates;
  if (!d) return;

  if (d.registrationOpen >= d.registrationClose) {
    this.invalidate("dates.registrationClose", "La clôture doit suivre l'ouverture des inscriptions");
  }
  if (d.sessionOpen >= d.submissionDeadline) {
    this.invalidate("dates.submissionDeadline", "La date limite doit suivre l'ouverture du sujet");
  }

  // Date limite de la vidéo et de la présentation (facultatives)
  if (d.videoDeadline && d.sessionOpen && d.videoDeadline <= d.sessionOpen) {
    this.invalidate("dates.videoDeadline", "La date limite de la vidéo doit suivre l'ouverture du sujet");
  }
  if (d.presentationDeadline && d.sessionOpen && d.presentationDeadline <= d.sessionOpen) {
    this.invalidate("dates.presentationDeadline", "La date limite de la présentation doit suivre l'ouverture du sujet");
  }

  // La date d'annonce des résultats reste obligatoire (repli pour la présentation)
  if (!d.resultsDate) {
    this.invalidate("dates.resultsDate", "La date d'annonce des résultats est obligatoire");
  } else {
    if (d.submissionDeadline && d.resultsDate <= d.submissionDeadline) {
      this.invalidate("dates.resultsDate", "L'annonce des résultats doit être après la date limite de dépôt");
    }
    for (const k of ["videoDeadline", "presentationDeadline"]) {
      if (d[k] && d[k] > d.resultsDate) {
        this.invalidate(`dates.${k}`, "Cette date limite doit précéder l'annonce des résultats");
      }
    }
  }

  if (d.evaluationStart && d.evaluationEnd && d.evaluationStart >= d.evaluationEnd) {
    this.invalidate("dates.evaluationEnd", "La fin de l'évaluation doit suivre son début");
  }
  if (this.teamSize.min > this.teamSize.max) {
    this.invalidate("teamSize.max", "Le maximum doit être supérieur ou égal au minimum");
  }
});

export default mongoose.model("Edition", editionSchema);