import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema.Types;

// Texte bilingue : l'admin écrit en français, l'anglais est traduit automatiquement
const text = {
  fr: { type: String, trim: true, default: "" },
  en: { type: String, trim: true, default: "" },
};

// Un sous-critère noté sur "max" points (ex. "Qualité du modèle" /10)
const subCriterionSchema = new mongoose.Schema({
  label:       text,
  description: text,
  max:         { type: Number, required: true, min: 0.5 },
});

// Un critère avec sa pondération (en %). Sans sous-critère, il est noté directement sur "max".
const criterionSchema = new mongoose.Schema({
  label:       text,
  description: text,
  weight:      { type: Number, required: true, min: 0 }, // F6.1 : pondération en %
  max:         { type: Number, default: 10, min: 0.5 },  // utilisé seulement sans sous-critère
  subCriteria: [subCriterionSchema],
});

// F6.1 : grille d'évaluation d'une édition (une seule par édition)
const evaluationGridSchema = new mongoose.Schema(
  {
    edition:           { type: ObjectId, ref: "Edition", required: true, unique: true },
    scale:             { type: Number, default: 20, min: 1, max: 1000 }, // barème : note finale /20, /100…
    criteria:          [criterionSchema],
    evaluatorsPerTeam: { type: Number, default: 2, min: 1, max: 10 },    // F6.2 : affectation automatique
    gapThreshold:      { type: Number, default: 3, min: 0 },             // F6.7 : écart max toléré (sur le barème)
    updatedBy:         { type: ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

export default mongoose.model("EvaluationGrid", evaluationGridSchema);
