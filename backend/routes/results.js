import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { getPublicResults, myCertificate } from "../controllers/resultsController.js";

const router = Router();

router.get("/", getPublicResults);                   // public : classement officiel publié
router.get("/certificate", protect, myCertificate);  // participant connecté : son attestation PDF

export default router;
