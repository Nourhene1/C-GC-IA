import { Router } from "express";
import { protect, authorize } from "../middleware/auth.js";
import { juryHandlers } from "../controllers/evaluationStageController.js";

const router = Router();
router.use(protect, authorize("jury"));

router.get("/", juryHandlers.list);
router.get("/:id", juryHandlers.detail);
router.put("/:id", juryHandlers.saveDraft);
router.post("/:id/submit", juryHandlers.submit);

export default router;