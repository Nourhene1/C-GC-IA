import mongoose from "mongoose";
import { DELIVERABLE_KINDS } from "../utils/submissionConfig.js";

const { ObjectId } = mongoose.Schema.Types;

// F5.5 : une version déposée. Jamais modifiée ni supprimée : c'est la trace.
const versionSchema = new mongoose.Schema({
  version:      { type: Number, required: true },
  fileName:     String,                                 // nom sur le disque (absent pour un lien)
  originalName: String,
  mimeType:     String,
  size:         Number,
  sha256:       String,                                 // empreinte, reprise dans l'accusé
  url:          String,                                 // lien (vidéo)
  receivedAt:   { type: Date, default: Date.now },      // heure serveur (F5.6)
  late:         { type: Boolean, default: false },      // déposé pendant la tolérance
  uploadedBy:   { type: ObjectId, ref: "User" },
});

const itemSchema = new mongoose.Schema(
  {
    kind:     { type: String, enum: DELIVERABLE_KINDS, required: true },
    versions: [versionSchema],
  },
  { _id: false }
);

// Un espace de dépôt par équipe et par édition (F5.1)
const submissionSchema = new mongoose.Schema(
  {
    edition:  { type: ObjectId, ref: "Edition", required: true },
    team:     { type: ObjectId, ref: "Team", required: true },
    anonCode: { type: String, required: true },          // F5.8 : identifiant d'évaluation à l'aveugle
    items:    [itemSchema],
  },
  { timestamps: true }
);

submissionSchema.index({ edition: 1, team: 1 }, { unique: true });
submissionSchema.index({ edition: 1, anonCode: 1 }, { unique: true });

export default mongoose.model("Submission", submissionSchema);