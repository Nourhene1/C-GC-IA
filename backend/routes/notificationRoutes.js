import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { listMine, markRead, markAllRead, removeOne } from "../controllers/notificationController.js";

const router = Router();

router.use(protect);
router.get("/", listMine);
router.patch("/read-all", markAllRead); // avant "/:id/read"
router.patch("/:id/read", markRead);
router.delete("/:id", removeOne);

export default router;
