import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema.Types;

// F6.7 : décision du jury de délibération quand les évaluateurs sont trop éloignés.
// La note retenue remplace la moyenne des évaluateurs pour cette équipe.
const deliberationSchema = new mongoose.Schema(
  {
    edition:    { type: ObjectId, ref: "Edition", required: true },
    team:       { type: ObjectId, ref: "Team", required: true },
    finalScore: { type: Number, required: true, min: 0 },
    note:       { type: String, trim: true, maxlength: 2000, default: "" },
    by:         { type: ObjectId, ref: "User" },
  },
  { timestamps: true }
);

deliberationSchema.index({ edition: 1, team: 1 }, { unique: true });

export default mongoose.model("Deliberation", deliberationSchema);
