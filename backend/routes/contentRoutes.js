import { Router } from "express";
import { getPublicContent } from "../controllers/contentController.js";
import { listPublicFaq } from "../controllers/faqController.js";
import { sendContact } from "../controllers/contactController.js";
import { rateLimit } from "../utils/rateLimit.js";

const router = Router();

// Module 3 — routes publiques
router.get("/content", getPublicContent); // F3.1, F3.2, F3.5, F3.6
router.get("/faq", listPublicFaq);        // F3.3

// F3.4 : au plus 5 messages par heure et par adresse IP
router.post("/contact", rateLimit({ max: 5, windowMs: 60 * 60 * 1000 }), sendContact);

export default router;
