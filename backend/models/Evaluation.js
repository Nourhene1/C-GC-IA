import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema.Types;

export const EVALUATION_STATUSES = ["pending", "draft", "submitted"]; // à faire / en cours / terminée

// Note d'un élément de la grille (sous-critère, ou critère sans sous-critère)
const scoreSchema = new mongoose.Schema(
  {
    item:  { type: ObjectId, required: true },
    value: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

// F6.5 : trace des validations et des réouvertures
const historySchema = new mongoose.Schema(
  {
    action: { type: String, enum: ["submitted", "reopened"], required: true },
    at:     { type: Date, default: Date.now },
    by:     { type: ObjectId, ref: "User" },
    reason: { type: String, default: "" },
    total:  { type: Number, default: null }, // note au moment de l'action
  },
  { _id: false }
);

// F6.2 / F6.3 : une affectation = une évaluation d'une équipe par un évaluateur
const evaluationSchema = new mongoose.Schema(
  {
    edition:     { type: ObjectId, ref: "Edition", required: true },
    team:        { type: ObjectId, ref: "Team", required: true },
    evaluator:   { type: ObjectId, ref: "User", required: true },
    status:      { type: String, enum: EVALUATION_STATUSES, default: "pending" },
    scores:      [scoreSchema],
    comment:     { type: String, trim: true, maxlength: 5000, default: "" },
    total:       { type: Number, default: null }, // F6.4 : note pondérée, calculée par le serveur
    submittedAt: { type: Date, default: null },
    assignedBy:  { type: ObjectId, ref: "User", default: null },
    autoAssigned: { type: Boolean, default: false },
    history:     [historySchema],
  },
  { timestamps: true }
);

evaluationSchema.index({ edition: 1, team: 1, evaluator: 1 }, { unique: true });
evaluationSchema.index({ evaluator: 1, edition: 1 });

export default mongoose.model("Evaluation", evaluationSchema);
