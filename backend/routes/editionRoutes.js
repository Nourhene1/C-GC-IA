import { Router } from "express";
import { getCurrent, listArchives, getArchive } from "../controllers/editionController.js";

const router = Router();

// Routes publiques : aucune connexion nécessaire
router.get("/current", getCurrent);   // F1.1 + F1.3
router.get("/archives", listArchives); // F1.1 : historique
router.get("/:year", getArchive);      // détail d'une édition passée

export default router;
