import express from "express";
import { listPublicEventSponsors } from "../controllers/adminEventSponsorController.js";

const router = express.Router();

// GET /api/event-sponsors?edition=
router.get("/", listPublicEventSponsors);

export default router;