// Choisit la version d'un texte bilingue { fr, en } selon la langue.
// Si l'anglais est vide, on affiche le français.
export const pick = (obj, locale) => (obj ? (locale === "en" && obj.en) || obj.fr || "" : "");

// Date -> valeur d'un <input type="datetime-local"> ("2026-10-01T08:00"), à l'heure locale
export function toDateTimeInput(date) {
  if (!date) return "";
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Valeur d'un <input type="datetime-local"> -> date ISO envoyée à l'API
export const fromDateTimeInput = (value) => (value ? new Date(value).toISOString() : null);

// Les étapes clés d'une édition, dans l'ordre (F1.3)
export const MILESTONES = ["registrationOpen", "registrationClose", "sessionOpen", "submissionDeadline"];
