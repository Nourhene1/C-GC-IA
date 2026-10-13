import Evaluation from "../models/Evaluation.js";
import EvaluationGrid from "../models/EvaluationGrid.js";

const round2 = (n) => Math.round(n * 100) / 100;

// Poids par défaut si la grille finale n'en a pas encore enregistré
export const DEFAULT_STAGE_WEIGHTS = { pre: 30, final: 70 };

// Pour chaque équipe : moyenne des évaluations validées par étape, puis note totale.
// Total = barème final × (poids pré × note pré / barème pré + poids final × note finale / barème final)
export async function stageScores(edition) {
  const [evaluations, grids] = await Promise.all([
    Evaluation.find({ edition: edition._id, status: "submitted" }).select("team stage total").lean(),
    EvaluationGrid.find({ edition: edition._id }).select("stage scale stageWeights").lean(),
  ]);

  // Barèmes par étape (20 par défaut si la grille n'existe pas encore)
  const scales = { pre: 20, final: 20 };
  // Poids lus uniquement sur la grille finale
  let weights = { ...DEFAULT_STAGE_WEIGHTS };
  for (const g of grids) {
    scales[g.stage] = g.scale;
    if (g.stage === "final" && g.stageWeights) {
      weights = { pre: g.stageWeights.pre, final: g.stageWeights.final };
    }
  }

  // Somme et nombre des notes validées, par équipe et par étape
  const sums = new Map(); // "teamId|stage" -> { sum, n }
  for (const e of evaluations) {
    const key = `${e.team}|${e.stage}`;
    const cur = sums.get(key) ?? { sum: 0, n: 0 };
    cur.sum += e.total ?? 0;
    cur.n += 1;
    sums.set(key, cur);
  }

  const avg = (teamId, stage) => {
    const cur = sums.get(`${teamId}|${stage}`);
    return cur ? round2(cur.sum / cur.n) : null;
  };

  // Note totale uniquement si les deux étapes ont au moins une évaluation validée
  const byTeam = new Map();
  for (const teamId of new Set(evaluations.map((e) => String(e.team)))) {
    const pre = avg(teamId, "pre");
    const final = avg(teamId, "final");
    const total =
      pre !== null && final !== null
        ? round2(
            scales.final * (
              (weights.pre / 100) * (pre / scales.pre) +
              (weights.final / 100) * (final / scales.final)
            )
          )
        : null;
    byTeam.set(teamId, { pre, final, total });
  }

  return { scales, weights, byTeam };
}

// Ajoute preScore, finalScore et totalScore à chaque ligne du classement
export function attachStageScores(rows, byTeam) {
  return rows.map((row) => {
    const s = byTeam.get(String(row.team)) ?? { pre: null, final: null, total: null };
    return { ...row, preScore: s.pre, finalScore: s.final, totalScore: s.total };
  });
}