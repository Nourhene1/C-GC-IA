import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { subjectAccess } from "../middleware/subject.js";
import { getSubject, downloadFile, downloadZip } from "../controllers/subjectController.js";

const router = Router();

// Toutes les routes exigent : connexion + accès au sujet (équipe validée + heure d'ouverture)
router.use(protect, subjectAccess);

router.get("/", getSubject);                          // F4.2 + F4.7
router.get("/download.zip", downloadZip);             // F4.5
router.get("/files/:fileId/download", downloadFile);  // F4.3 + F4.4

export default router;
