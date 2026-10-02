import { Router } from "express";
import { protect, authorize } from "../middleware/auth.js";
import {
  myEvaluations, myEvaluation, saveDraft, submitEvaluation,
} from "../controllers/evaluationJuryController.js";

const router = Router();
router.use(protect, authorize("jury"));

router.get("/", myEvaluations);                 // mes équipes à évaluer
router.get("/:id", myEvaluation);               // F6.3 : grille + livrables
router.put("/:id", saveDraft);                  // brouillon
router.post("/:id/submit", submitEvaluation);   // F6.5 : validation (verrouille la saisie)

export default router;
