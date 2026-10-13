import { Router } from "express";
import { protect, authorize } from "../middleware/auth.js";
import {
  uploadSponsorLogo, uploadPoster as uploadPosterFile,
  uploadRulesPdf as uploadRulesPdfFile, uploadJuryPhoto as uploadJuryPhotoFile,
} from "../middleware/upload.js";
import { newsVideoUpload } from "../middleware/newsVideoUpload.js";
import {
  getStats, listTeams, getTeam, updateStatus, exportTeams,
} from "../controllers/adminTeamController.js";
import {
  listAdminNews, getAdminNews, createNews, updateNews, publishNews, unpublishNews, deleteNews,
} from "../controllers/newsController.js";
import { createSponsor, updateSponsor, deleteSponsor } from "../controllers/sponsorController.js";
import {
  listEditions, getEdition, createEdition, updateEdition, setCurrent, uploadPoster, deletePoster,
} from "../controllers/editionController.js";
import {
  getAdminContent, updateContent, uploadRulesPdf, deleteRulesPdf, uploadJuryPhoto, resendStaffInvite,
} from "../controllers/contentController.js";
import { listAdminFaq, createFaq, updateFaq, deleteFaq } from "../controllers/faqController.js";
import { listMessages, markMessage, deleteMessage } from "../controllers/contactController.js";
import { translate } from "../utils/translate.js";
import { editionVideoUpload } from "../middleware/editionVideoUpload.js";

const router = Router();

// Toutes les routes de ce fichier : connecté ET admin
router.use(protect, authorize("admin"));

router.get("/stats", getStats);

// Module 2 — dossiers des équipes
router.get("/teams", listTeams);
router.get("/teams/export", exportTeams); // avant "/teams/:id" !
router.get("/teams/:id", getTeam);
router.patch("/teams/:id/status", updateStatus);

// Module 1 — actualités (F1.2, F1.4, F1.6) + vidéo importée
router.get("/news", listAdminNews);
router.post("/news", newsVideoUpload, createNews);
router.get("/news/:id", getAdminNews);
router.put("/news/:id", newsVideoUpload, updateNews);
router.patch("/news/:id/publish", publishNews);
router.patch("/news/:id/unpublish", unpublishNews);
router.delete("/news/:id", deleteNews);

// Module 1 — partenaires (F1.5)
router.post("/sponsors", uploadSponsorLogo, createSponsor);
router.put("/sponsors/:id", uploadSponsorLogo, updateSponsor);
router.delete("/sponsors/:id", deleteSponsor);

// Module 1 — éditions et historique (F1.1)
router.get("/editions", listEditions);
router.post("/editions", editionVideoUpload, createEdition);
router.get("/editions/:id", getEdition);
router.put("/editions/:id", editionVideoUpload, updateEdition);
router.patch("/editions/:id/current", setCurrent);
router.post("/editions/:id/poster", uploadPosterFile, uploadPoster);
router.delete("/editions/:id/poster", deletePoster);

// Module 3 — contenu (règlement, éligibilité, prix, jury, pilotage, contacts, calendrier)
router.get("/content", getAdminContent);
router.put("/content", updateContent);
router.post("/content/rules-pdf", uploadRulesPdfFile, uploadRulesPdf);
router.delete("/content/rules-pdf", deleteRulesPdf);
router.post("/content/jury-photo", uploadJuryPhotoFile, uploadJuryPhoto);
router.post("/content/jury/:id/invite", resendStaffInvite);     // renvoyer l'invitation d'un juré
router.post("/content/pilotage/:id/invite", resendStaffInvite); // renvoyer l'invitation d'un membre du pilotage

// Module 3 — FAQ (F3.3)
router.get("/faq", listAdminFaq);
router.post("/faq", createFaq);
router.put("/faq/:id", updateFaq);
router.delete("/faq/:id", deleteFaq);

// Module 3 — messages du formulaire de contact (F3.4)
router.get("/messages", listMessages);
router.patch("/messages/:id", markMessage);
router.delete("/messages/:id", deleteMessage);

// Traduction automatique FR -> EN des contenus saisis par l'admin
router.post("/translate", async (req, res) => {
  const { text, from = "fr", to = "en" } = req.body;
  if (!text?.trim()) return res.status(400).json({ code: "FIELDS_REQUIRED" });
  try {
    res.json({ translation: await translate(text, from, to) });
  } catch {
    res.status(502).json({ code: "TRANSLATION_FAILED" });
  }
});

export default router;