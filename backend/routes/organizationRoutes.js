import { Router } from "express";
import { protect, authorize } from "../middleware/auth.js";
import { uploadOrganizationPhoto } from "../middleware/uploadOrganizationPhoto.js";

import {
  listPublicMembers,
  listAdminMembers,
  createMember,
  updateMember,
  deleteMember,
} from "../controllers/organizationController.js";

const router = Router();

router.get("/organization", listPublicMembers);

const admin = [protect, authorize("admin")];

router.get("/admin/organization", ...admin, listAdminMembers);
router.post("/admin/organization", ...admin, uploadOrganizationPhoto, createMember);
router.put("/admin/organization/:id", ...admin, uploadOrganizationPhoto, updateMember);
router.delete("/admin/organization/:id", ...admin, deleteMember);

export default router;