import mongoose from "mongoose";

// Texte bilingue facultatif (une nouvelle définition à chaque appel,
// pour éviter de partager le même objet entre plusieurs champs)
const textField = () => ({
  fr: { type: String, trim: true, default: "" },
  en: { type: String, trim: true, default: "" },
});

// F3.5 : un prix ou une récompense
const prizeSchema = new mongoose.Schema({
  rank:   { type: Number, default: 1 },
  title:  textField(),   // ex. "1er prix"
  reward: textField(),   // ex. "3 000 DT + stage"
});

// F3.6 : un membre du jury
const jurySchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  role:         textField(),   // ex. "Présidente du jury"
  organization: { type: String, trim: true, default: "" },
  photo:        { type: String, default: null }, // /uploads/jury/xxx.jpg
  // Privé (jamais affiché sur le site) : sert à inviter le juré à créer son compte
  email:        { type: String, trim: true, lowercase: true, default: "" },
  user:         { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
});

// Membre du pilotage : personnel d'évaluation créé par l'admin pour la pré-évaluation.
// Pas de photo ni d'organisation, et jamais affiché sur le site public.
const pilotageSchema = new mongoose.Schema({
  name:  { type: String, required: true, trim: true },
  role:  textField(),           // libellé interne, facultatif
  // Privé : sert à créer et activer le compte pilotage
  email: { type: String, trim: true, lowercase: true, default: "" },
  user:  { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
});

// F3.4 : un référent à contacter
const contactSchema = new mongoose.Schema({
  name:  { type: String, required: true, trim: true },
  role:  textField(),
  email: { type: String, trim: true, lowercase: true, default: "" },
  phone: { type: String, trim: true, default: "" },
});

// F3.2 : événement supplémentaire du calendrier (séance d'information, cérémonie…)
const eventSchema = new mongoose.Schema({
  title:       textField(),
  description: textField(),
  start:       { type: Date, required: true },
  end:         { type: Date },
});

// Contenu éditorial d'une édition (Module 3) : un seul document par édition
const editionContentSchema = new mongoose.Schema(
  {
    edition: { type: mongoose.Schema.Types.ObjectId, ref: "Edition", required: true, unique: true },

    // F3.1 : règlement (texte consultable + PDF téléchargeable)
    rules: {
      content: textField(),
      pdf:     { type: String, default: null },  // /uploads/rules/xxx.pdf
      pdfName: { type: String, default: "" },
    },

    eligibility: textField(),   // F3.5 : critères d'éligibilité
    prizes:      [prizeSchema],
    jury:        [jurySchema],
    pilotage:    [pilotageSchema],  // personnel de pré-évaluation (privé)
    contacts:    [contactSchema],
    events:      [eventSchema],
  },
  { timestamps: true }
);

export default mongoose.model("EditionContent", editionContentSchema);