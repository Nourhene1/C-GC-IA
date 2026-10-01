import { Router } from "express";
import { protect, authorize } from "../middleware/auth.js";
import { subjectAccess } from "../middleware/subject.js";
import { requireDepositWindow, uploadDeliverable } from "../middleware/submissionUpload.js";
import { getMySubmission, depositFile, depositLink, downloadVersion } from "../controllers/submissionController.js";

const router = Router();

// Équipe validée + sujet ouvert (subjectAccess), puis fenêtre de dépôt pour les écritures
router.use(protect, authorize("chef", "membre"), subjectAccess);

router.get("/", getMySubmission);                                                       // F5.1
router.post("/deliverables/:kind", requireDepositWindow, uploadDeliverable, depositFile); // F5.2-5.6
router.post("/deliverables/:kind/link", requireDepositWindow, depositLink);
router.get("/versions/:versionId/download", downloadVersion);

export default router;