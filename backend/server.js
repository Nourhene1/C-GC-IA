import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import multer from "multer";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import editionRoutes from "./routes/editionRoutes.js";
import teamRoutes from "./routes/teamRoutes.js";
import newsRoutes from "./routes/newsRoutes.js";
import sponsorRoutes from "./routes/sponsorRoutes.js";
import contentRoutes from "./routes/contentRoutes.js";
import { PUBLIC_DIR } from "./utils/files.js";
import { startNewsScheduler } from "./utils/newsNotifier.js";
import { translateProvider } from "./utils/translate.js";

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:3000" }));
app.use(express.json({ limit: "1mb" }));

// Fichiers publics : logos des équipes, logos des sponsors, affiches.
// Les pièces justificatives (uploads/private) ne sont JAMAIS servies ici :
// elles passent par une route protégée (teamRoutes).
app.use("/uploads", express.static(PUBLIC_DIR, { maxAge: "7d" }));

// Routes
app.get("/api/health", (req, res) => res.json({ ok: true }));
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/editions", editionRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/sponsors", sponsorRoutes);
app.use("/api", contentRoutes); // /api/content, /api/faq, /api/contact

// Route inconnue
app.use("/api", (req, res) => res.status(404).json({ code: "NOT_FOUND" }));

// Gestionnaire d'erreurs : toujours en dernier
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const code = err.code === "LIMIT_FILE_SIZE" ? "FILE_TOO_LARGE" : "UPLOAD_ERROR";
    return res.status(400).json({ code });
  }
  if (err.code === "INVALID_FILE_TYPE") return res.status(400).json({ code: "INVALID_FILE_TYPE" });
  if (err.name === "ValidationError") return res.status(400).json({ code: "VALIDATION_ERROR" });
  if (err.name === "CastError") return res.status(404).json({ code: "NOT_FOUND" }); // id mal formé
  if (err.code === 11000) return res.status(409).json({ code: "DUPLICATE" });

  console.error(err);
  res.status(500).json({ code: "SERVER_ERROR" });
});

const PORT = process.env.PORT || 5000;

for (const key of ["MONGO_URI", "JWT_SECRET", "FRONTEND_URL"]) {
  if (!process.env[key]) {
    console.error(`${key} manquant dans le fichier .env`);
    process.exit(1);
  }
}

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connecté");
    app.listen(PORT, () => {
      console.log(`API sur le port ${PORT}`);
      console.log(`Traduction automatique : ${translateProvider}`);
    });
    startNewsScheduler(); // F1.4 / F1.6 : envoi des annonces programmées
  })
  .catch((err) => console.error("Erreur MongoDB :", err.message));
