import News, { NEWS_CATEGORIES } from "../models/News.js";
import { getCurrentEdition } from "../utils/edition.js";
import { runNewsNotifications } from "../utils/newsNotifier.js";
import { withEnglish } from "../utils/autoTranslate.js";
import { parseVideoUrl, removeStoredVideo, discardUpload } from "../utils/video.js";

// ---------------------------------------------------------------------------
// Public — F1.2
// ---------------------------------------------------------------------------

// GET /api/news?limit=10&page=1&category=rappel
export const listPublicNews = async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 10, 50);
  const page = Math.max(Number(req.query.page) || 1, 1);
  const filter = News.visibleFilter();
  if (NEWS_CATEGORIES.includes(req.query.category)) filter.category = req.query.category;

  const [news, total] = await Promise.all([
    News.find(filter)
      .sort({ publishAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select("category title content publishAt")
      .lean(),
    News.countDocuments(filter),
  ]);

  res.json({ news, total, page, pages: Math.max(Math.ceil(total / limit), 1) });
};

// GET /api/news/:id — une annonce programmée reste invisible avant sa date
export const getPublicNews = async (req, res) => {
  const news = await News.findOne({ _id: req.params.id, ...News.visibleFilter() })
    .select("category title content publishAt video")
    .lean();
  if (!news) return res.status(404).json({ code: "NOT_FOUND" });
  res.json({ news });
};

// ---------------------------------------------------------------------------
// Admin — F1.6
// ---------------------------------------------------------------------------

// GET /api/admin/news?state=draft|scheduled|published
export const listAdminNews = async (req, res) => {
  const now = new Date();
  const filters = {
    draft: { published: false },
    scheduled: { published: true, publishAt: { $gt: now } },
    published: { published: true, publishAt: { $lte: now } },
  };
  const filter = filters[req.query.state] || {};

  const [news, counts] = await Promise.all([
    News.find(filter).sort({ publishAt: -1, updatedAt: -1 }).populate("author", "prenom nom"),
    Promise.all(Object.entries(filters).map(async ([k, f]) => [k, await News.countDocuments(f)])),
  ]);

  res.json({ news, counts: Object.fromEntries(counts) });
};

// GET /api/admin/news/:id
export const getAdminNews = async (req, res) => {
  const news = await News.findById(req.params.id);
  if (!news) return res.status(404).json({ code: "NOT_FOUND" });
  res.json({ news });
};

// Applique le formulaire à l'annonce.
// mode : "draft" (brouillon), "now" (publier maintenant), "schedule" (programmer)
// file : vidéo importée (multer), facultative
async function applyBody(news, body, file) {
  const { category, title = {}, content = {}, notifyTeams, mode, publishAt, video, removeVideo } = body;

  if (!title.fr?.trim() || !content.fr?.trim()) return "FIELDS_REQUIRED";
  if (category && !NEWS_CATEGORIES.includes(category)) return "VALIDATION_ERROR";

  // Vidéo, par ordre de priorité : fichier importé > suppression > lien > vidéo existante conservée
  if (file) {
    news.video = { url: `/uploads/news-videos/${file.filename}`, provider: "file", videoId: file.filename };
  } else if (removeVideo === true || removeVideo === "true") {
    news.video = { url: "", provider: "", videoId: "" };
  } else if (String(video || "").trim()) {
    const parsed = parseVideoUrl(video);
    if (parsed === null) return "INVALID_VIDEO_URL";
    news.video = parsed;
  }

  news.category = category || "general";

  // L'admin écrit en français : l'anglais est traduit automatiquement
  const [en1, en2] = await Promise.all([withEnglish(title, news.title), withEnglish(content, news.content)]);
  news.title = en1;
  news.content = en2;
  news.notifyTeams = Boolean(notifyTeams);

  if (mode === "draft") {
    news.published = false;
  } else if (mode === "schedule") {
    const date = new Date(publishAt);
    if (Number.isNaN(date.getTime()) || date <= new Date()) return "INVALID_PUBLISH_DATE";
    news.published = true;
    news.publishAt = date;
  } else {
    // "now" : on garde la date d'origine si l'annonce était déjà en ligne
    const alreadyLive = news.published && news.publishAt && news.publishAt <= new Date();
    news.published = true;
    if (!alreadyLive) news.publishAt = new Date();
  }
  return null;
}

// POST /api/admin/news
export const createNews = async (req, res) => {
  const edition = await getCurrentEdition();
  const news = new News({ edition: edition?._id, author: req.user._id });

  const error = await applyBody(news, req.body, req.file);
  if (error) {
    await discardUpload(req.file);
    return res.status(400).json({ code: error });
  }

  await news.save();
  await runNewsNotifications(); // envoi immédiat si publiée maintenant
  res.status(201).json({ news });
};

// PUT /api/admin/news/:id
export const updateNews = async (req, res) => {
  const news = await News.findById(req.params.id);
  if (!news) {
    await discardUpload(req.file);
    return res.status(404).json({ code: "NOT_FOUND" });
  }

  // Mémorise l'ancien fichier pour le supprimer s'il est remplacé ou retiré
  const previousFile = news.video?.provider === "file" ? news.video.videoId : null;

  const error = await applyBody(news, req.body, req.file);
  if (error) {
    await discardUpload(req.file);
    return res.status(400).json({ code: error });
  }

  await news.save();

  if (previousFile && previousFile !== news.video?.videoId) {
    await removeStoredVideo(previousFile);
  }

  await runNewsNotifications();
  res.json({ news });
};

// PATCH /api/admin/news/:id/unpublish — retirer du site (F1.6)
export const unpublishNews = async (req, res) => {
  const news = await News.findByIdAndUpdate(req.params.id, { published: false }, { new: true });
  if (!news) return res.status(404).json({ code: "NOT_FOUND" });
  res.json({ news });
};

// PATCH /api/admin/news/:id/publish — remettre en ligne tout de suite
export const publishNews = async (req, res) => {
  const news = await News.findById(req.params.id);
  if (!news) return res.status(404).json({ code: "NOT_FOUND" });
  news.published = true;
  if (!news.publishAt || news.publishAt > new Date()) news.publishAt = new Date();
  await news.save();
  await runNewsNotifications();
  res.json({ news });
};

// DELETE /api/admin/news/:id
export const deleteNews = async (req, res) => {
  const news = await News.findByIdAndDelete(req.params.id);
  if (!news) return res.status(404).json({ code: "NOT_FOUND" });

  // Supprime aussi le fichier vidéo stocké sur le serveur
  if (news.video?.provider === "file") await removeStoredVideo(news.video.videoId);

  res.json({ ok: true });
};