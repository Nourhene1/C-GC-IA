// Rapport d'évaluation PDF d'un candidat : note globale + détail pré-évaluation et finale
import PDFDocument from "pdfkit";
import Evaluation from "../models/Evaluation.js";
import EvaluationGrid from "../models/EvaluationGrid.js";
import { gridItems } from "./grading.js";

const NAVY = "#173A63";
const GREY = "#6B7280";
const INK = "#1F2937";

const TEXTS = {
  fr: {
    title: "Rapport d'évaluation",
    team: "Équipe",
    global: "Note globale",
    weights: (p, f) => `Pondération : pré-évaluation ${p} % · finale ${f} %`,
    pre: "Pré-évaluation",
    final: "Évaluation finale",
    average: "Moyenne",
    evaluator: (i) => `Évaluateur ${i}`,
    none: "Aucune évaluation validée pour cette étape.",
    comment: "Commentaire",
  },
  en: {
    title: "Evaluation report",
    team: "Team",
    global: "Overall score",
    weights: (p, f) => `Weighting: pre-evaluation ${p}% · final ${f}%`,
    pre: "Pre-evaluation",
    final: "Final evaluation",
    average: "Average",
    evaluator: (i) => `Evaluator ${i}`,
    none: "No validated evaluation for this stage.",
    comment: "Comment",
  },
};

// Nombre sans zéros inutiles : 16.50 -> "16.5", 18 -> "18"
const fmt = (n) => (n === null || n === undefined ? "—" : String(Math.round(Number(n) * 100) / 100));

// Évaluations TERMINÉES de l'équipe (toutes étapes) + grilles, pour les libellés des critères
export async function teamEvaluationDetail(editionId, teamId) {
  const [evaluations, grids] = await Promise.all([
    Evaluation.find({ edition: editionId, team: teamId, status: "submitted" })
      .select("stage scores comment total submittedAt").sort({ submittedAt: 1 }).lean(),
    EvaluationGrid.find({ edition: editionId }).lean(),
  ]);
  return { evaluations, grids: Object.fromEntries(grids.map((g) => [g.stage, g])) };
}

// Points obtenus par critère, pour une évaluation donnée
function criterionLines(grid, evaluation, lang) {
  const items = gridItems(grid);
  return grid.criteria.map((c) => {
    const leaves = items.filter((i) => i.criterion === String(c._id));
    const max = leaves.reduce((sum, i) => sum + i.max, 0);
    const points = leaves.reduce((sum, i) => {
      const found = evaluation.scores.find((s) => String(s.item) === i.id);
      return sum + (found?.value ?? 0);
    }, 0);
    return { label: c.label?.[lang] || c.label?.fr || "", points, max };
  });
}

// PDF d'une page pour un candidat.
// entry.scores = { total, pre, final, scale, preScale, weights }
// Les évaluateurs ne sont pas nommés (anonymat du jury).
export function evaluationReportBuffer({ entry, detail, lang = "fr", editionTitle }) {
  const T = TEXTS[lang] ?? TEXTS.fr;
  const { scores } = entry;
  const doc = new PDFDocument({ size: "A4", margin: 48, info: { Title: T.title } });
  const done = new Promise((resolve, reject) => {
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
  const width = doc.page.width - 96;

  // En-tête
  doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(18).text(T.title);
  doc.fillColor(GREY).font("Helvetica").fontSize(10).text(editionTitle);
  doc.moveDown(0.8);
  doc.fillColor(INK).font("Helvetica-Bold").fontSize(14).text(entry.fullName);
  doc.font("Helvetica").fontSize(11).text(`${T.team} : ${entry.teamName}`);
  doc.moveDown(0.8);

  // Bandeau de la note globale
  const top = doc.y;
  doc.roundedRect(48, top, width, 64, 8).fill(NAVY);
  doc.fillColor("#FFFFFF").font("Helvetica").fontSize(11).text(T.global, 66, top + 12);
  doc.font("Helvetica-Bold").fontSize(26).text(`${fmt(scores.total)} / ${scores.scale}`, 66, top + 28);
  doc.font("Helvetica").fontSize(10)
    .text(T.weights(scores.weights.pre, scores.weights.final), 66, top + 14, { width: width - 36, align: "right" });
  doc.y = top + 80;

  // Pré-évaluation puis évaluation finale
  for (const stage of ["pre", "final"]) {
    const isPre = stage === "pre";
    const stageScale = isPre ? scores.preScale : scores.scale;
    const stageScore = isPre ? scores.pre : scores.final;
    const grid = detail.grids[stage];
    const evals = detail.evaluations.filter((e) => e.stage === stage);

    doc.moveDown(0.6);
    doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(13)
      .text(`${isPre ? T.pre : T.final} — ${T.average} : ${fmt(stageScore)} / ${stageScale}`);
    doc.moveTo(48, doc.y + 2).lineTo(48 + width, doc.y + 2).lineWidth(0.5).strokeColor("#CBD5E1").stroke();
    doc.moveDown(0.5);

    if (!grid || evals.length === 0) {
      doc.fillColor(GREY).font("Helvetica").fontSize(10).text(T.none);
      continue;
    }

    evals.forEach((ev, i) => {
      doc.fillColor(INK).font("Helvetica-Bold").fontSize(11)
        .text(`${T.evaluator(i + 1)} — ${fmt(ev.total)} / ${stageScale}`);
      doc.font("Helvetica").fontSize(10).fillColor(INK);
      for (const line of criterionLines(grid, ev, lang)) {
        doc.text(`• ${line.label} : ${fmt(line.points)} / ${fmt(line.max)}`, { indent: 12 });
      }
      if (ev.comment) doc.fillColor(GREY).text(`${T.comment} : ${ev.comment}`, { indent: 12 });
      doc.moveDown(0.6);
    });
  }

  doc.end();
  return done;
}