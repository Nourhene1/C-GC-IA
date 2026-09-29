import { Router } from "express";

import {
  register,
  verifyEmail,
  resendVerification,
  login,
  getInvitation,
  activate,
  forgotPassword,
  resetPassword,
  me,
   verifyResetCode,
} from "../controllers/authController.js";

import { protect } from "../middleware/auth.js";

const router = Router();

router.post("/register", register);                       // F2.1
router.post("/verify-email", verifyEmail);                // F2.1 : lien de confirmation
router.post("/resend-verification", resendVerification);

router.post("/login", login);

router.get("/invitation/:token", getInvitation);          // F2.3 : infos de l'invitation
router.post("/activate", activate);                       // F2.3 : le membre choisit son mot de passe

router.post("/forgot-password", forgotPassword);          // Récupération mot de passe
router.post("/reset-password", resetPassword);            // Réinitialisation mot de passe
router.post("/verify-reset-code", verifyResetCode);   // ajouter


router.get("/me", protect, me);

export default router;