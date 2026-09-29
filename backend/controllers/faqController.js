import Faq, { FAQ_CATEGORIES } from "../models/Faq.js";
import { withEnglish } from "../utils/autoTranslate.js";

const byCategoryThenOrder = (a, b) =>
  FAQ_CATEGORIES.indexOf(a.category) - FAQ_CATEGORIES.indexOf(b.category) || a.order - b.order;

// GET /api/faq — questions publiées (F3.3)
export const listPublicFaq = async (req, res) => {
  const faqs = await Faq.find({ published: true }).select("category question answer order").lean();
  res.json({ faqs: faqs.sort(byCategoryThenOrder) });
};

// GET /api/admin/faq — toutes les questions, publiées ou non
export const listAdminFaq = async (req, res) => {
  const faqs = await Faq.find().lean();
  res.json({ faqs: faqs.sort(byCategoryThenOrder) });
};

// previous : la question déjà enregistrée (pour ne retraduire que ce qui a changé)
async function readBody(body, previous = {}) {
  const { category = "autre", question = {}, answer = {}, order = 0, published = true } = body;
  if (!question.fr?.trim() || !answer.fr?.trim()) return { error: "FIELDS_REQUIRED" };
  if (!FAQ_CATEGORIES.includes(category)) return { error: "VALIDATION_ERROR" };
  return {
    data: {
      category,
      question: await withEnglish(question, previous.question),
      answer: await withEnglish(answer, previous.answer),
      order: Number(order) || 0,
      published: Boolean(published),
    },
  };
}

// POST /api/admin/faq
export const createFaq = async (req, res) => {
  const { data, error } = await readBody(req.body);
  if (error) return res.status(400).json({ code: error });
  const faq = await Faq.create(data);
  res.status(201).json({ faq });
};

// PUT /api/admin/faq/:id
export const updateFaq = async (req, res) => {
  const previous = await Faq.findById(req.params.id).lean();
  if (!previous) return res.status(404).json({ code: "NOT_FOUND" });
  const { data, error } = await readBody(req.body, previous);
  if (error) return res.status(400).json({ code: error });
  const faq = await Faq.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
  if (!faq) return res.status(404).json({ code: "NOT_FOUND" });
  res.json({ faq });
};

// DELETE /api/admin/faq/:id
export const deleteFaq = async (req, res) => {
  const faq = await Faq.findByIdAndDelete(req.params.id);
  if (!faq) return res.status(404).json({ code: "NOT_FOUND" });
  res.json({ ok: true });
};
