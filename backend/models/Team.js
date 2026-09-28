import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema.Types;

export const STATUSES = ["brouillon", "en_attente", "valide", "rejete", "en_revision"];

// Statuts dans lesquels le chef peut encore modifier le dossier (F2.8)
export const EDITABLE_STATUSES = ["brouillon", "en_attente", "en_revision"];

const memberSchema = new mongoose.Schema({
  user:    { type: ObjectId, ref: "User" },
  nom:     { type: String, required: true, trim: true },
  prenom:  { type: String, required: true, trim: true },
  email:   { type: String, required: true, lowercase: true, trim: true },
  niveau:  { type: String, trim: true, default: "" },  // obligatoire à la soumission
  filiere: { type: String, trim: true, default: "" },  // obligatoire à la soumission
  isChef:  { type: Boolean, default: false },
});

const documentSchema = new mongoose.Schema({
  kind:         { type: String, required: true },
  member:       { type: ObjectId, default: null }, // null = pièce de l'équipe
  fileName:     { type: String, required: true },  // nom du fichier sur le disque
  originalName: { type: String, required: true },
  mimeType:     String,
  size:         Number,
  uploadedAt:   { type: Date, default: Date.now },
});

const historySchema = new mongoose.Schema(
  {
    status: { type: String, enum: STATUSES },
    reason: String,
    by:     { type: ObjectId, ref: "User" },
    at:     { type: Date, default: Date.now },
  },
  { _id: false }
);

const teamSchema = new mongoose.Schema(
  {
    edition:       { type: ObjectId, ref: "Edition", required: true },
    name:          { type: String, required: true, trim: true, maxlength: 60 },
    etablissement: { type: String, required: true, trim: true },
    filiere:       { type: String, required: true, trim: true },
    coach: {
      nom:   { type: String, trim: true, default: "" },
      email: { type: String, lowercase: true, trim: true, default: "" },
    },
    logo: { type: String, default: null }, // chemin public, ex. /uploads/logos/xxx.png

    chef:      { type: ObjectId, ref: "User", required: true },
    members:   [memberSchema],
    documents: [documentSchema],

    status:          { type: String, enum: STATUSES, default: "brouillon" },
    rejectionReason: { type: String, default: "" },
    submittedAt:     Date,
    history:         [historySchema],
  },
  { timestamps: true }
);

teamSchema.methods.isEditable = function () {
  return EDITABLE_STATUSES.includes(this.status);
};

// Change le statut et garde la trace de la décision
teamSchema.methods.setStatus = function (status, by, reason = "") {
  this.status = status;
  this.rejectionReason = reason;
  this.history.push({ status, reason, by });
};

teamSchema.index({ edition: 1, name: 1 }, { unique: true });
teamSchema.index({ edition: 1, chef: 1 }, { unique: true });

export default mongoose.model("Team", teamSchema);
