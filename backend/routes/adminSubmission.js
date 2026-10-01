import { Router } from "express";
import { protect, authorize } from "../middleware/auth.js";
import { adminList, adminTeamDetail, adminDownload, updateSettings } from "../controllers/submissionAdminController.js";

const router = Router();
router.use(protect, authorize("admin"));

router.get("/", adminList);                                                   // F5.7
router.patch("/settings", updateSettings);                                    // F5.2 / F5.8
router.get("/teams/:teamId", adminTeamDetail);
router.get("/teams/:teamId/versions/:versionId/download", adminDownload);

export default router;