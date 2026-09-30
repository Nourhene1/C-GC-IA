import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema.Types;

export const SUBJECT_KINDS = ["enonce", "donnees", "annexe"];

const text = {
  fr: { type: String, trim: true, default: "" },
  en: { type: String, trim: true, default: "" },
};

// F4.1 : un document du sujet (stocké dans uploads/private/subject)
const fileSchema = new mongoose.Schema({
  kind:         { type: String, enum: SUBJECT_KINDS, required: true },
  title:        { type: String, trim: true, default: "" },
  fileName:     { type: String, required: true }, // nom sur le disque
  originalName: { type: String, required: true },
  mimeType:     String,
  size:         Number,
  uploadedAt:   { type: Date, default: Date.now },
});

// F4.7 : ancienne version d'un addendum
const versionSchema = new mongoose.Schema(
  { version: Number, title: text, content: text, at: Date },
  { _id: false }
);

// F4.7 : addendum / clarification publié après l'ouverture
const addendumSchema = new mongoose.Schema({
  title:       { fr: { type: String, required: true, trim: true }, en: { type: String, trim: true, default: "" } },
  content:     { fr: { type: String, required: true, trim: true }, en: { type: String, trim: true, default: "" } },
  version:     { type: Number, default: 1 },
  publishedAt: { type: Date, default: Date.now },
  updatedAt:   Date,
  history:     [versionSchema],
  createdBy:   { type: ObjectId, ref: "User" },
});

// Un seul document "sujet" par édition.
// La date d'ouverture est celle de l'édition : Edition.dates.sessionOpen.
const subjectSchema = new mongoose.Schema(
  {
    edition:    { type: ObjectId, ref: "Edition", required: true, unique: true },
    files:      [fileSchema],
    addenda:    [addendumSchema],
    notifiedAt: { type: Date, default: null }, // F4.6 : notification d'ouverture déjà envoyée
  },
  { timestamps: true }
);

export default mongoose.model("Subject", subjectSchema);