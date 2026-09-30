import { Router } from "express";
import { protect, authorize } from "../middleware/auth.js";
import { uploadSubjectFile } from "../middleware/upload.js";
import {
  adminGetSubject, addFile, removeSubjectFile, setSessionOpen,
  createAddendum, updateAddendum, listAudit, exportAudit,
} from "../controllers/Subjectcontroller.js";

const router = Router();

router.use(protect, authorize("admin"));

router.get("/", adminGetSubject);
router.post("/files", uploadSubjectFile, addFile);          // F4.1
router.delete("/files/:fileId", removeSubjectFile);
router.patch("/session-open", setSessionOpen);              // F4.2
router.post("/addenda", createAddendum);                    // F4.7
router.put("/addenda/:id", updateAddendum);
router.get("/audit", listAudit);                            // F4.4
router.get("/audit/export", exportAudit);                   // F4.4 : CSV / PDF

export default router;