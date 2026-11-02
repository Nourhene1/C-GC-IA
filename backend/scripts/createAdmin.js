import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/User.js";

await mongoose.connect(process.env.MONGO_URI);

const exists = await User.findOne({ email: "info@ia-gc-challenge.tn" });
if (exists) {
  console.log("L'admin existe déjà");
} else {
  await User.create({
    nom: "Admin",
    prenom: "Comité",
    email: "info@ia-gc-challenge.tn",
    password: "Admin12345",
    role: "admin",
    isVerified: true,
  });
  console.log("Admin créé");
}

await mongoose.disconnect();
