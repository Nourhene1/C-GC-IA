import mongoose from "mongoose";

export const SPONSOR_TIERS = ["platine", "or", "argent", "bronze", "partenaire"];

// F1.5 : partenaire / sponsor d'une édition
const sponsorSchema = new mongoose.Schema(
  {
    edition: { type: mongoose.Schema.Types.ObjectId, ref: "Edition", required: true },
    name:    { type: String, required: true, trim: true, maxlength: 100 },
    logo:    { type: String, default: null }, // /uploads/sponsors/xxx.png
    website: { type: String, trim: true, default: "" },
    tier:    { type: String, enum: SPONSOR_TIERS, default: "partenaire" },
    order:   { type: Number, default: 0 }, // ordre d'affichage dans un même niveau
  },
  { timestamps: true }
);

export default mongoose.model("Sponsor", sponsorSchema);
