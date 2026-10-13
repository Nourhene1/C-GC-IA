// Règles par type de livrable (F5.3 / F5.4) : à adapter aux exigences du sujet
// deadline : "submission" = date limite de dépôt (avec tolérance)
//            "results"    = date d'annonce des résultats (sans tolérance)
export const DELIVERABLES = {
  report: { exts: [".pdf"],                                       maxMb: 20,  link: false, required: true,  deadline: "submission" },
  code:   { exts: [".zip", ".tar", ".gz", ".tgz", ".7z", ".rar"], maxMb: 100, link: false, required: true,  deadline: "submission" },
  slides: { exts: [".pdf", ".ppt", ".pptx", ".odp"],              maxMb: 50,  link: false, required: false, deadline: "results" },
  video:  { exts: [".mp4", ".webm", ".mov"],                      maxMb: 300, link: true,  required: false, deadline: "submission" },
};

export const DELIVERABLE_KINDS = Object.keys(DELIVERABLES);
export const REQUIRED_KINDS = DELIVERABLE_KINDS.filter((k) => DELIVERABLES[k].required);
export const MAX_VERSIONS_PER_KIND = 20;