import express from "express";
import multer from "multer";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { protect, authorize } from "../middleware/auth.js";
import { PUBLIC_DIR } from "../utils/files.js";
import * as ctrl from "../controllers/adminEventSponsorController.js";

const router = express.Router();

const LOGO_DIR = path.join(PUBLIC_DIR, "event-sponsors");
const ALLOWED_MIME = ["image/png", "image/jpeg", "image/webp"]; // pas de SVG (risque XSS)

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdirSync(LOGO_DIR, { recursive: true });
    cb(null, LOGO_DIR);
  },
  filename: (req, file, cb) => {
    cb(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`);
  },
});

const uploadLogo = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      const err = new Error("Type de fichier non autorisé");
      err.code = "INVALID_FILE_TYPE";
      return cb(err);
    }
    cb(null, true);
  },
});

// Toutes les routes de ce fichier sont réservées à l'admin
router.use(protect, authorize("admin"));

router.get("/", ctrl.listEventSponsors);
router.post("/", uploadLogo.single("logo"), ctrl.createEventSponsor);
router.patch("/reorder", ctrl.reorderEventSponsors); // avant /:id
router.get("/:id", ctrl.getEventSponsor);
router.put("/:id", uploadLogo.single("logo"), ctrl.updateEventSponsor);
router.patch("/:id/active", ctrl.toggleEventSponsorActive);
router.delete("/:id", ctrl.deleteEventSponsor);

export default router;