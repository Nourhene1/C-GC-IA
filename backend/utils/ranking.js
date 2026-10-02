// Module 7 : calcul du classement à partir des évaluations VALIDÉES du Module 6
import Evaluation from "../models/Evaluation.js";
import Deliberation from "../models/Deliberation.js";
import Team from "../models/Team.js";
import { getGrid, evaluableSubmissions } from "./evaluations.js";
import { computeTotal, teamSummary } from "./grading.js";

const round2 = (n) => Math.round(n * 100) / 100;

// F7.2 : critères de départage disponibles
//  - "lowestGap"          : l'écart le plus faible entre évaluateurs (notes les plus concordantes)
//  - "earliestSubmission" : le dépôt le plus tôt (dernière version reçue la plus ancienne)
//  - "criterion:<id>"     : la meilleure moyenne sur un critère de la grille
export const BASE_TIE_BREAKERS = ["lowestGap", "earliestSubmission"];

export function validTieBreakers(list, grid) {
  if (!Array.isArray(list)) return false;
  const criteria = new Set((grid?.criteria ?? []).map((c) => `criterion:${c._id}`));
  return list.every((k) => BASE_TIE_BREAKERS.includes(k) || criteria.has(k)) && new Set(list).size === list.length;
}

// Valeur d'une équipe pour un critère de départage. Plus grand = mieux.
function tieValue(row, key) {
  if (key === "lowestGap") return -(row.gap ?? 0);
  if (key === "earliestSubmission") return row.lastDepositAt ? -new Date(row.lastDepositAt).getTime() : -Infinity;
  if (key.startsWith("criterion:")) return row.criteria[key.slice(10)] ?? 0;
  return 0;
}

// Compare deux équipes : note retenue, puis chaque critère de départage dans l'ordre.
// Renvoie { diff, key } : diff < 0 si a passe devant b ; key = critère qui a fait la différence.
function compare(a, b, tieBreakers) {
  if (a.score !== b.score) return { diff: b.score - a.score, key: null };
  for (const key of tieBreakers) {
    const va = round2(tieValue(a, key)), vb = round2(tieValue(b, key));
    if (va !== vb) return { diff: vb - va, key };
  }
  return { diff: 0, key: null };
}

// F7.1 / F7.2 : trie les équipes et attribue les rangs.
// Égalité parfaite (même après départage) = ex æquo, même rang (classement 1, 1, 3).
export function rankRows(rows, tieBreakers = []) {
  const ranked = rows.filter((r) => r.score !== null);
  const unranked = rows.filter((r) => r.score === null).map((r) => ({ ...r, rank: null }));

  ranked.sort((a, b) => compare(a, b, tieBreakers).diff || a.name.localeCompare(b.name));
  ranked.forEach((row, i) => {
    row.rank = i + 1;
    row.tied = false;
    row.decidedBy = null;
    if (i === 0) return;
    const prev = ranked[i - 1];
    const { diff, key } = compare(prev, row, tieBreakers);
    if (diff === 0) {
      row.rank = prev.rank;
      row.tied = prev.tied = true;
    } else if (key) {
      row.decidedBy = key; // même note que l'équipe précédente, départagée par ce critère
    }
  });
  return { ranked, unranked };
}

// Rassemble les données de l'édition et calcule le classement (prévisualisation F7.3)
export async function buildRanking(edition) {
  const [grid, submissions, evaluations, deliberations] = await Promise.all([
    getGrid(edition),
    evaluableSubmissions(edition),
    Evaluation.find({ edition: edition._id }).lean(),
    Deliberation.find({ edition: edition._id }).lean(),
  ]);
  const teams = await Team.find({ _id: { $in: submissions.map((s) => s.team._id) } })
    .select("name etablissement logo").lean();
  const teamById = new Map(teams.map((t) => [String(t._id), t]));
  const delibOf = new Map(deliberations.map((d) => [String(d.team), d]));
  const tieBreakers = edition.results?.tieBreakers ?? BASE_TIE_BREAKERS;

  const rows = submissions.map((s) => {
    const id = String(s.team._id);
    const team = teamById.get(id) ?? s.team;
    const evs = evaluations.filter((e) => String(e.team) === id);
    const done = evs.filter((e) => e.status === "submitted");
    const summary = teamSummary(evs, grid, delibOf.get(id));

    // Moyenne de chaque critère (contribution pondérée), utilisée pour le départage
    const criteria = {};
    for (const c of grid.criteria) {
      const values = done.map((e) => computeTotal(grid, e.scores).byCriterion.find((b) => b.criterion === String(c._id))?.contribution ?? 0);
      criteria[String(c._id)] = values.length ? round2(values.reduce((a, b) => a + b, 0) / values.length) : 0;
    }
    const lastDepositAt = s.items.flatMap((i) => i.versions).reduce((max, v) => (!max || v.receivedAt > max ? v.receivedAt : max), null);

    return {
      team: team._id, name: team.name, etablissement: team.etablissement ?? "", logo: team.logo ?? null,
      score: summary.final, average: summary.average, deliberated: !!delibOf.get(id),
      gap: summary.gap, alert: summary.alert, evaluations: done.length, assigned: evs.length,
      pending: evs.length - done.length, criteria, lastDepositAt,
    };
  });

  const { ranked, unranked } = rankRows(rows, tieBreakers);

  // Points à vérifier avant de publier
  const warnings = {
    incomplete: rows.filter((r) => r.pending > 0).map((r) => r.name),           // évaluations pas toutes validées
    alerts: rows.filter((r) => r.alert && !r.deliberated).map((r) => r.name),   // écart non tranché (F6.7)
    unranked: unranked.map((r) => r.name),                                      // aucune note validée
  };

  return { grid, ranked, unranked, warnings, tieBreakers };
}

// Ligne enregistrée dans la publication (sans les données de travail)
export const snapshotRow = (r) => ({
  rank: r.rank, team: r.team, name: r.name, etablissement: r.etablissement, logo: r.logo,
  score: r.score, average: r.average, deliberated: r.deliberated,
  tied: !!r.tied, decidedBy: r.decidedBy ?? null, evaluations: r.evaluations,
});
