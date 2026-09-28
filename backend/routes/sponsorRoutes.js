import { Router } from "express";
import { listSponsors } from "../controllers/sponsorController.js";

const router = Router();

router.get("/", listSponsors); // F1.5 : partenaires de l'édition

export default router;
