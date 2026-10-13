// Deux étapes d'évaluation, chacune avec sa grille, ses évaluateurs et ses affectations
export const STAGES = {
  final: { role: "jury", base: "/jury/evaluations" },        // évaluation finale
  pre:   { role: "pilotage", base: "/pilotage/evaluations" }, // pré-évaluation
};

// Valeur sûre pour un paramètre de requête : tout ce qui n'est pas "pre" vaut "final"
export const stageOf = (value) => (value === "pre" ? "pre" : "final");