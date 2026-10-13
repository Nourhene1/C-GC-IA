import { Router } from "express";
import { protect, authorize } from "../middleware/auth.js";
import {
  getAdminGrid, updateGrid, updateSettings, getOverview, getEvaluationDetail,
  autoAssign, assign, unassign, reopen, setDeliberation, exportEvaluations,
  getStageWeights, setStageWeights,
} from "../controllers/evaluationAdminController.js";

const router = Router();
// F6.9 : toutes les notes individuelles ne sont accessibles qu'aux administrateurs
router.use(protect, authorize("admin"));

router.get("/", getOverview);                                   // F6.6 : suivi
router.get("/grid", getAdminGrid);                              // F6.1
router.put("/grid", updateGrid);
router.patch("/settings", updateSettings);                      // F6.2 / F6.7 : réglages
router.post("/auto-assign", autoAssign);                        // F6.2 : affectation équilibrée
router.post("/assign", assign);                                 // F6.2 : affectation manuelle
router.get("/export", exportEvaluations);                       // F6.8 (avant "/:id" !)
router.get("/stage-weights", getStageWeights);                  // pondération des étapes (avant "/:id")
router.patch("/stage-weights", setStageWeights);                // pondération des étapes (avant "/:id")
router.put("/teams/:teamId/deliberation", setDeliberation);     // F6.7
router.get("/:id", getEvaluationDetail);
router.delete("/:id", unassign);
router.patch("/:id/reopen", reopen);                            // F6.5

export default router;