import Notification from "../models/Notification.js";

// GET /api/notifications
export const listMine = async (req, res) => {
  const [notifications, unread] = await Promise.all([
    Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50).lean(),
    Notification.countDocuments({ user: req.user._id, readAt: null }),
  ]);
  res.json({ notifications, unread });
};

// PATCH /api/notifications/:id/read
export const markRead = async (req, res) => {
  const n = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { readAt: new Date() },
    { new: true }
  );
  if (!n) return res.status(404).json({ code: "NOT_FOUND" });
  res.json({ notification: n });
};

// DELETE /api/notifications/:id — uniquement ses propres notifications
export const removeOne = async (req, res) => {
  const n = await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!n) return res.status(404).json({ code: "NOT_FOUND" });
  res.json({ ok: true });
};

// PATCH /api/notifications/read-all
export const markAllRead = async (req, res) => {
  await Notification.updateMany({ user: req.user._id, readAt: null }, { readAt: new Date() });
  res.json({ ok: true });
};