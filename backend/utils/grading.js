// Calculs du Module 6 : tout est fait côté serveur, le navigateur n'envoie que les notes brutes.

const round2 = (n) => Math.round(n * 100) / 100;

// Éléments notés de la grille : les sous-critères, ou le critère lui-même s'il n'en a pas
export function gridItems(grid) {
  return (grid?.criteria ?? []).flatMap((c) =>
    c.subCriteria?.length
      ? c.subCriteria.map((s) => ({ id: String(s._id), criterion: String(c._id), max: s.max }))
      : [{ id: String(c._id), criterion: String(c._id), max: c.max }]
  );
}

const totalWeight = (grid) => (grid?.criteria ?? []).reduce((sum, c) => sum + (Number(c.weight) || 0), 0);

// F6.1 : vérifie la grille envoyée par l'admin. Renvoie un code d'erreur ou null.
export function validateGrid({ scale, criteria }) {
  const s = Number(scale);
  if (!Number.isFinite(s) || s < 1 || s > 1000) return "GRID_INVALID_SCALE";
  if (!Array.isArray(criteria) || criteria.length === 0) return "GRID_EMPTY";

  for (const c of criteria) {
    if (!c.label?.fr?.trim()) return "GRID_LABEL_REQUIRED";
    if (!(Number(c.weight) > 0)) return "GRID_INVALID_WEIGHT";
    const subs = c.subCriteria ?? [];
    if (subs.length === 0 && !(Number(c.max) > 0)) return "GRID_INVALID_MAX";
    for (const sub of subs) {
      if (!sub.label?.fr?.trim()) return "GRID_LABEL_REQUIRED";
      if (!(Number(sub.max) > 0)) return "GRID_INVALID_MAX";
    }
  }
  // Les pondérations doivent faire 100 %
  if (Math.abs(totalWeight({ criteria }) - 100) > 0.01) return "GRID_WEIGHTS_NOT_100";
  return null;
}

// Vérifie les notes envoyées par l'évaluateur.
// Renvoie { scores } (uniquement les éléments de la grille) ou { error }.
export function cleanScores(grid, scores = []) {
  const items = new Map(gridItems(grid).map((i) => [i.id, i]));
  const result = [];
  const seen = new Set();

  for (const s of Array.isArray(scores) ? scores : []) {
    const item = items.get(String(s?.item));
    if (!item || seen.has(item.id)) continue; // élément inconnu (grille modifiée) ou doublon : ignoré
    if (s.value === null || s.value === undefined || s.value === "") continue; // pas encore noté
    const value = Number(s.value);
    if (!Number.isFinite(value) || value < 0 || value > item.max) return { error: "INVALID_SCORE" };
    seen.add(item.id);
    result.push({ item: item.id, value: round2(value) });
  }
  return { scores: result };
}

// F6.4 : note pondérée d'un évaluateur, ramenée au barème.
// note = Σ (pondération du critère × points obtenus / points max) / Σ pondérations × barème
export function computeTotal(grid, scores = []) {
  const values = new Map(scores.map((s) => [String(s.item), s.value]));
  const weightSum = totalWeight(grid) || 1;
  const items = gridItems(grid);

  const byCriterion = (grid?.criteria ?? []).map((c) => {
    const leaves = items.filter((i) => i.criterion === String(c._id));
    const max = leaves.reduce((sum, i) => sum + i.max, 0);
    const points = leaves.reduce((sum, i) => sum + (values.get(i.id) ?? 0), 0);
    const contribution = max ? (c.weight / weightSum) * (points / max) * grid.scale : 0;
    return { criterion: String(c._id), points: round2(points), max, contribution: round2(contribution) };
  });

  const total = byCriterion.reduce((sum, c) => sum + c.contribution, 0);
  const complete = items.length > 0 && items.every((i) => values.has(i.id));
  return { total: round2(total), complete, byCriterion };
}

// F6.4 / F6.7 : synthèse d'une équipe à partir des évaluations TERMINÉES
export function teamSummary(evaluations, grid, deliberation) {
  const totals = evaluations.filter((e) => e.status === "submitted" && e.total !== null).map((e) => e.total);
  const average = totals.length ? round2(totals.reduce((a, b) => a + b, 0) / totals.length) : null;
  const gap = totals.length >= 2 ? round2(Math.max(...totals) - Math.min(...totals)) : null;
  const alert = gap !== null && gap > (grid?.gapThreshold ?? Infinity);
  const final = deliberation ? deliberation.finalScore : average;
  return { submittedCount: totals.length, average, gap, alert, final };
}

// F6.2 : affectation automatique équilibrée.
// Chaque équipe reçoit "perTeam" évaluateurs différents ; on choisit à chaque fois
// les évaluateurs les moins chargés (tirage au sort entre ceux à égalité).
// Les affectations existantes sont conservées. Renvoie la liste [{ team, evaluator }] à créer.
export function balancedAssignment({ teamIds, evaluatorIds, existing, perTeam, random = Math.random }) {
  const load = new Map(evaluatorIds.map((id) => [String(id), 0]));
  const byTeam = new Map(teamIds.map((id) => [String(id), new Set()]));
  for (const e of existing) {
    const ev = String(e.evaluator);
    if (load.has(ev)) load.set(ev, load.get(ev) + 1);
    byTeam.get(String(e.team))?.add(ev);
  }

  // Les équipes qui ont le moins d'évaluateurs passent en premier
  const order = [...byTeam.keys()].sort((a, b) => byTeam.get(a).size - byTeam.get(b).size);
  const created = [];

  for (const team of order) {
    const already = byTeam.get(team);
    const need = perTeam - already.size;
    if (need <= 0) continue;

    const candidates = [...load.keys()]
      .filter((ev) => !already.has(ev))
      .map((ev) => ({ ev, tie: random() }))
      .sort((a, b) => load.get(a.ev) - load.get(b.ev) || a.tie - b.tie)
      .slice(0, need);

    for (const { ev } of candidates) {
      created.push({ team, evaluator: ev });
      already.add(ev);
      load.set(ev, load.get(ev) + 1);
    }
  }
  return created;
}
