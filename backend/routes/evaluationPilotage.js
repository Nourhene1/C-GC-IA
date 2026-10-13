import { Router } from "express";
import { protect, authorize } from "../middleware/auth.js";
import { pilotageHandlers } from "../controllers/evaluationStageController.js";

// Pré-évaluation : mêmes actions que le jury, sur la grille de pré-évaluation
const router = Router();
router.use(protect, authorize("pilotage"));

router.get("/", pilotageHandlers.list);
router.get("/:id", pilotageHandlers.detail);
router.put("/:id", pilotageHandlers.saveDraft);
router.post("/:id/submit", pilotageHandlers.submit);

export default router;