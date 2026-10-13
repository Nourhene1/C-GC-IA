import { Router } from "express";
import { protect, authorize } from "../middleware/auth.js";
import { juryList, juryDownload } from "../controllers/submissionAdminController.js";

// Lecture des livrables par le pilotage (pré-évaluation).
// Mêmes règles que le jury : après la clôture des dépôts, dernière version uniquement,
// et anonymisation si l'admin l'a activée.
const router = Router();
router.use(protect, authorize("pilotage"));

router.get("/", juryList);
router.get("/:submissionId/versions/:versionId/download", juryDownload);

export default router;