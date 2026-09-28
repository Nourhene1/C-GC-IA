import { Router } from "express";
import {
  createTeam, getMyTeam, updateTeam, updateLogo, deleteLogo,
  addMember, updateMember, removeMember, resendInvitation,
  uploadDocument, deleteDocument, downloadDocument, submitTeam,
} from "../controllers/teamController.js";
import { protect, authorize } from "../middleware/auth.js";
import { loadMyTeam, requireEditable } from "../middleware/team.js";
import { uploadDocument as uploadDocumentFile, uploadLogo as uploadLogoFile } from "../middleware/upload.js";

const router = Router();

router.use(protect); // toutes les routes : utilisateur connecté

// Consultation : chef et membres
router.get("/me", authorize("chef", "membre"), getMyTeam);

// Création : un chef qui n'a pas encore d'équipe
router.post("/", authorize("chef"), createTeam);

// Modifications : chef uniquement, et seulement si le dossier est modifiable.
// Le fichier est reçu APRÈS les vérifications, pour ne rien enregistrer inutilement.
const chefEdit = [authorize("chef"), loadMyTeam, requireEditable];

router.put("/me", ...chefEdit, updateTeam);
router.post("/me/logo", ...chefEdit, uploadLogoFile, updateLogo);
router.delete("/me/logo", ...chefEdit, deleteLogo);

router.post("/me/members", ...chefEdit, addMember);
router.put("/me/members/:memberId", ...chefEdit, updateMember);
router.delete("/me/members/:memberId", ...chefEdit, removeMember);
router.post("/me/members/:memberId/resend", authorize("chef"), loadMyTeam, resendInvitation);

router.post("/me/documents", ...chefEdit, uploadDocumentFile, uploadDocument);
router.delete("/me/documents/:docId", ...chefEdit, deleteDocument);

router.post("/me/submit", authorize("chef"), loadMyTeam, submitTeam);

// Consultation d'une pièce : admin ou membre de l'équipe (vérifié dans le controller)
router.get("/:teamId/documents/:docId", downloadDocument);

export default router;
