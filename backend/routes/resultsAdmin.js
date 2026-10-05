import { Router } from "express";
import { protect, authorize } from "../middleware/auth.js";
import {
  getResultsAdmin, updateResultsSettings, publishResults, withdrawResults,
  resendResults, exportResults, teamCertificates,
} from "../controllers/resultsAdminController.js";

const router = Router();
router.use(protect, authorize("admin"));

router.get("/", getResultsAdmin);                          // F7.1 / F7.3 : prévisualisation
router.patch("/settings", updateResultsSettings);          // F7.2 / F7.5 / F7.6 : règles
router.post("/publish", publishResults);                   // F7.4 : publication (maintenant ou programmée)
router.post("/withdraw", withdrawResults);                 // F7.4 : retrait tracé
router.post("/notify", resendResults);                     // F7.6 : renvoyer emails + attestations
router.get("/export", exportResults);                      // F7.7 : PDF / Excel
router.get("/certificates/:teamId", teamCertificates);     // F7.6 : aperçu des attestations

export default router;
