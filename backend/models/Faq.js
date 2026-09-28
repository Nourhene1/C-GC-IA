import mongoose from "mongoose";

export const FAQ_CATEGORIES = ["inscription", "equipe", "sujet", "depot", "evaluation", "autre"];

// F3.3 : une question de la FAQ
const faqSchema = new mongoose.Schema(
  {
    category: { type: String, enum: FAQ_CATEGORIES, default: "autre" },
    question: {
      fr: { type: String, required: true, trim: true, maxlength: 300 },
      en: { type: String, trim: true, default: "", maxlength: 300 },
    },
    answer: {
      fr: { type: String, required: true, trim: true },
      en: { type: String, trim: true, default: "" },
    },
    order:     { type: Number, default: 0 },     // ordre d'affichage dans la catégorie
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Faq", faqSchema);

