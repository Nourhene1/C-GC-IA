import mongoose from "mongoose";

// Texte bilingue facultatif
const text = {
  fr: { type: String, trim: true, default: "" },
  en: { type: String, trim: true, default: "" },
};

// F3.5 : un prix ou une récompense
const prizeSchema = new mongoose.Schema({
  rank:        { type: Number, default: 1 },
  title:       text,             // ex. "1er prix"
  reward:      text,             // ex. "3 000 DT + stage"
});

// F3.6 : un membre du jury
const jurySchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  role:         text,            // ex. "Présidente du jury"
  organization: { type: String, trim: true, default: "" },
  photo:        { type: String, default: null }, // /uploads/jury/xxx.jpg
});

// F3.4 : un référent à contacter
const contactSchema = new mongoose.Schema({
  name:  { type: String, required: true, trim: true },
  role:  text,
  email: { type: String, trim: true, lowercase: true, default: "" },
  phone: { type: String, trim: true, default: "" },
});

// F3.2 : événement supplémentaire du calendrier (séance d'information, cérémonie…)
const eventSchema = new mongoose.Schema({
  title:       text,
  description: text,
  start:       { type: Date, required: true },
  end:         { type: Date },
});

// Contenu éditorial d'une édition (Module 3) : un seul document par édition
const editionContentSchema = new mongoose.Schema(
  {
    edition: { type: mongoose.Schema.Types.ObjectId, ref: "Edition", required: true, unique: true },

    // F3.1 : règlement (texte consultable + PDF téléchargeable)
    rules: {
      content: text,
      pdf:     { type: String, default: null },  // /uploads/rules/xxx.pdf
      pdfName: { type: String, default: "" },
    },

    eligibility: text,   // F3.5 : critères d'éligibilité
    prizes:   [prizeSchema],
    jury:     [jurySchema],
    contacts: [contactSchema],
    events:   [eventSchema],
  },
  { timestamps: true }
);

export default mongoose.model("EditionContent", editionContentSchema);
