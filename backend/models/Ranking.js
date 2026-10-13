import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema.Types;

export const RANKING_STATUSES = ["scheduled", "published", "withdrawn"];

// Une ligne du classement, figée au moment de la publication
const rowSchema = new mongoose.Schema(
  {
    rank:          { type: Number, default: null }, // null = non classée (aucune évaluation validée)
    team:          { type: ObjectId, ref: "Team" },
    name:          String,
    etablissement: String,
    logo:          String,
    score:         { type: Number, default: null }, // note retenue (moyenne ou délibération)
    average:       { type: Number, default: null },
    deliberated:   { type: Boolean, default: false },
    tied:          { type: Boolean, default: false }, // ex æquo (F7.2)
    decidedBy:     { type: String, default: null },  // critère qui a départagé l'équipe de la précédente
    evaluations:   { type: Number, default: 0 },     // évaluations validées

    // Notes par étape, figées avec le classement (F7.4)
    preScore:      { type: Number, default: null },  // moyenne pré-évaluation, sur preScale
    finalScore:    { type: Number, default: null },  // moyenne évaluation finale, sur scale
    totalScore:    { type: Number, default: null },  // note totale pondérée, sur scale
  },
  { _id: false }
);

// F7.4 : une publication officielle du classement (version figée).
// Une publication n'est jamais modifiée : pour corriger, on la retire (avec motif) puis on republie.
const rankingSchema = new mongoose.Schema(
  {
    edition:   { type: ObjectId, ref: "Edition", required: true },
    version:   { type: Number, required: true },
    status:    { type: String, enum: RANKING_STATUSES, default: "scheduled" },
    publishAt: { type: Date, required: true },                // date/heure de publication officielle
    rows:      [rowSchema],
    settings: {                                               // règles utilisées pour ce classement
      scale:            Number,
      preScale:         { type: Number, default: 20 },        // barème de la pré-évaluation
      weights: {                                              // pondération des étapes, en %
        pre:   { type: Number, default: 30 },
        final: { type: Number, default: 70 },
      },
      podiumSize:       Number,
      showScores:       Boolean,
      tieBreakers:      [String],
      sendCertificates: Boolean,
    },
    publishedBy:    { type: ObjectId, ref: "User" },
    notifiedAt:     { type: Date, default: null },            // équipes prévenues + attestations envoyées
    withdrawnAt:    { type: Date, default: null },
    withdrawnBy:    { type: ObjectId, ref: "User", default: null },
    withdrawReason: { type: String, default: "" },
  },
  { timestamps: true }
);

rankingSchema.index({ edition: 1, version: -1 }, { unique: true });

export default mongoose.model("Ranking", rankingSchema);