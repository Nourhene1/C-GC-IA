import fs from "fs";
import path from "path";
import EventSponsor from "../models/EventSponsor.js";
import { PUBLIC_DIR } from "../utils/files.js";

const LOGO_DIR = path.join(PUBLIC_DIR, "event-sponsors");
const EDITABLE_FIELDS = ["name", "website", "tier", "edition", "order", "active"];

const publicUrl = (filename) => `/uploads/event-sponsors/${filename}`;

const logoFilePath = (url) => {
  if (!url || !url.startsWith("/uploads/event-sponsors/")) return null;
  return path.join(LOGO_DIR, path.basename(url));
};

const removeFile = async (filePath) => {
  if (!filePath) return;
  await fs.promises.unlink(filePath).catch(() => {});
};

const cleanupUpload = (file) => file && removeFile(file.path);

const toBool = (v) => v === true || v === "true";

// GET /api/admin/event-sponsors?edition=&tier=&active=&q=
export async function listEventSponsors(req, res, next) {
  try {
    const filter = {};
    if (req.query.edition) filter.edition = req.query.edition;
    if (req.query.tier) filter.tier = req.query.tier;
    if (req.query.active !== undefined) filter.active = toBool(req.query.active);
    if (req.query.q) filter.name = { $regex: req.query.q.trim(), $options: "i" };

    const sponsors = await EventSponsor.find(filter)
      .sort({ order: 1, createdAt: -1 })
      .populate("edition", "name year");

    res.json(sponsors);
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/event-sponsors/:id
export async function getEventSponsor(req, res, next) {
  try {
    const sponsor = await EventSponsor.findById(req.params.id).populate("edition", "name year");
    if (!sponsor) return res.status(404).json({ code: "NOT_FOUND" });
    res.json(sponsor);
  } catch (err) {
    next(err);
  }
}

// POST /api/admin/event-sponsors  (multipart : logo + champs)
export async function createEventSponsor(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ code: "LOGO_REQUIRED" });

    const sponsor = await EventSponsor.create({
      name: req.body.name,
      logo: publicUrl(req.file.filename),
      website: req.body.website || "",
      tier: req.body.tier || "bronze",
      edition: req.body.edition || null,
      order: Number(req.body.order) || 0,
      active: req.body.active === undefined ? true : toBool(req.body.active),
    });

    res.status(201).json(sponsor);
  } catch (err) {
    await cleanupUpload(req.file);
    next(err);
  }
}

// PUT /api/admin/event-sponsors/:id  (multipart optionnel : logo)
export async function updateEventSponsor(req, res, next) {
  try {
    const current = await EventSponsor.findById(req.params.id);
    if (!current) {
      await cleanupUpload(req.file);
      return res.status(404).json({ code: "NOT_FOUND" });
    }

    const updates = {};
    for (const field of EDITABLE_FIELDS) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }
    if ("edition" in updates && !updates.edition) updates.edition = null;
    if ("order" in updates) updates.order = Number(updates.order) || 0;
    if ("active" in updates) updates.active = toBool(updates.active);
    if (req.file) updates.logo = publicUrl(req.file.filename);

    const sponsor = await EventSponsor.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (req.file) await removeFile(logoFilePath(current.logo)); // supprime l'ancien logo

    res.json(sponsor);
  } catch (err) {
    await cleanupUpload(req.file);
    next(err);
  }
}

// PATCH /api/admin/event-sponsors/:id/active  { active: true|false }
export async function toggleEventSponsorActive(req, res, next) {
  try {
    const sponsor = await EventSponsor.findByIdAndUpdate(
      req.params.id,
      { active: toBool(req.body.active) },
      { new: true }
    );
    if (!sponsor) return res.status(404).json({ code: "NOT_FOUND" });
    res.json(sponsor);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/admin/event-sponsors/reorder  { items: [{ id, order }, ...] }
export async function reorderEventSponsors(req, res, next) {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ code: "VALIDATION_ERROR" });
    }

    await EventSponsor.bulkWrite(
      items.map(({ id, order }) => ({
        updateOne: {
          filter: { _id: id },
          update: { $set: { order: Number(order) || 0 } },
        },
      }))
    );

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/admin/event-sponsors/:id
export async function deleteEventSponsor(req, res, next) {
  try {
    const sponsor = await EventSponsor.findByIdAndDelete(req.params.id);
    if (!sponsor) return res.status(404).json({ code: "NOT_FOUND" });

    await removeFile(logoFilePath(sponsor.logo));
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

// GET /api/event-sponsors  (public : uniquement les sponsors visibles)
export async function listPublicEventSponsors(req, res, next) {
  try {
    const filter = { active: true };
    if (req.query.edition) filter.edition = req.query.edition;

    const sponsors = await EventSponsor.find(filter)
      .sort({ order: 1 })
      .select("name logo website tier");

    res.json(sponsors);
  } catch (err) {
    next(err);
  }
}