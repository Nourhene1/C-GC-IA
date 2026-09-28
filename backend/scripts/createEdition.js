import "dotenv/config";
import mongoose from "mongoose";
import Edition from "../models/Edition.js";

await mongoose.connect(process.env.MONGO_URI);

// Une seule édition en cours : on retire le statut aux autres
await Edition.updateMany({ year: { $ne: 2026 } }, { isCurrent: false });

const data = {
  year: 2026,
  isCurrent: true,
  title: {
    fr: "Compétition IA & Génie Civil — ISET Sfax 2026",
    en: "AI & Civil Engineering Competition — ISET Sfax 2026",
  },
  theme: {
    fr: "L'IA au service du Génie Civil",
    en: "AI serving Civil Engineering",
  },
  // ⚠ Dates d'exemple : remplace-les par celles fixées par le comité
  dates: {
    registrationOpen:   new Date("2026-09-01T08:00:00+01:00"),
    registrationClose:  new Date("2026-10-31T23:59:00+01:00"),
    sessionOpen:        new Date("2026-11-14T09:00:00+01:00"),
    submissionDeadline: new Date("2026-11-15T17:00:00+01:00"),
    resultsDate:        new Date("2026-11-20T18:00:00+01:00"),
  },
  teamSize: { min: 2, max: 5 },
  requiredDocuments: [
    { kind: "carte_etudiant", perMember: true },
    { kind: "attestation_scolarite", perMember: true },
    { kind: "autorisation", perMember: false },
  ],
  stats: { teams: 24, participants: 96, schools: 8 },
};

// Crée l'édition 2026 ou la met à jour (on passe par save() pour appliquer les validations)
const edition = (await Edition.findOne({ year: 2026 })) || new Edition();
edition.set(data);
await edition.save();

console.log("Édition 2026 créée ou mise à jour");
await mongoose.disconnect();
