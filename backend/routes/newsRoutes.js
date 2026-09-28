import { Router } from "express";
import { listPublicNews, getPublicNews } from "../controllers/newsController.js";

const router = Router();

// F1.2 : actualités publiques (seulement celles publiées et dont la date est atteinte)
router.get("/", listPublicNews);
router.get("/:id", getPublicNews);

export default router;
