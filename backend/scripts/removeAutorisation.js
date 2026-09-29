// Supprime la pièce "Autorisation de participation" :
//  1. retire l'exigence de toutes les éditions déjà en base
//  2. supprime les autorisations déjà envoyées par les équipes (base + fichiers)
// À lancer une seule fois : npm run remove-autorisation
import "dotenv/config";
import mongoose from "mongoose";
import Edition from "../models/Edition.js";
import Team from "../models/Team.js";
import { removeFile, privatePath } from "../utils/files.js";

const KIND = "autorisation";

await mongoose.connect(process.env.MONGO_URI);

// 1. Éditions : on réaffecte le tableau filtré
let editions = 0;
for (const edition of await Edition.find({ "requiredDocuments.kind": KIND })) {
  edition.requiredDocuments = edition.requiredDocuments.filter((r) => r.kind !== KIND);
  await edition.save();
  editions++;
}

// 2. Équipes : on retire les documents et on efface les fichiers du disque
let files = 0;
for (const team of await Team.find({ "documents.kind": KIND })) {
  for (const doc of team.documents.filter((d) => d.kind === KIND)) {
    await removeFile(privatePath(doc.fileName));
    files++;
  }
  team.documents = team.documents.filter((d) => d.kind !== KIND);
  await team.save();
}

console.log(`Autorisation retirée : ${editions} édition(s), ${files} fichier(s) supprimé(s)`);
await mongoose.disconnect();