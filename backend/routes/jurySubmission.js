import { Router } from "express";
import { protect, authorize } from "../middleware/auth.js";
import { juryList, juryDownload } from "../controllers/submissionAdminController.js";

const router = Router();
router.use(protect, authorize("jury"));

router.get("/", juryList);
router.get("/:submissionId/versions/:versionId/download", juryDownload);

export default router;