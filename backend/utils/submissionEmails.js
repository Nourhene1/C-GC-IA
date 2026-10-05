const KIND_LABEL = {
  fr: { report: "Rapport", code: "Code source", slides: "Présentation", video: "Vidéo" },
  en: { report: "Report", code: "Source code", slides: "Slides", video: "Video" },
};

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export function receiptMail({ receipt, locale = "fr", link }) {
  const L = locale === "en" ? "en" : "fr";
  const kind = KIND_LABEL[L][receipt.kind];
  const when = new Intl.DateTimeFormat(L === "en" ? "en-GB" : "fr-FR", {
    dateStyle: "full",
    timeStyle: "long", // "long" affiche déjà le fuseau (ex. 14:32:05 UTC)
    timeZone: process.env.APP_TIMEZONE || "UTC",
  }).format(new Date(receipt.receivedAt));

  const t = L === "en"
    ? { subject: `Submission receipt — ${kind} v${receipt.version}`, title: "Submission received", team: "Team", item: "Deliverable", file: "File", at: "Received on", late: "Submitted after the deadline (grace period).", view: "View my submission" }
    : { subject: `Accusé de dépôt — ${kind} v${receipt.version}`, title: "Dépôt bien reçu", team: "Équipe", item: "Livrable", file: "Fichier", at: "Reçu le", late: "Déposé après la date limite (tolérance).", view: "Voir mon dépôt" };

  const rows = [
    [t.team, receipt.team],
    [t.item, `${kind} (v${receipt.version})`],
    [t.file, receipt.name],
    [t.at, when],
  ].filter(Boolean);

  const text = [
    t.title, "",
    ...rows.map(([k, v]) => `${k} : ${v}`),
    receipt.late ? `\n${t.late}` : "",
    `\n${t.view} : ${link}`,
  ].join("\n");

  const html =
    `<h2>${t.title}</h2><table cellpadding="4">` +
    rows.map(([k, v]) => `<tr><td><b>${k}</b></td><td>${escapeHtml(v)}</td></tr>`).join("") +
    `</table>${receipt.late ? `<p><b>${t.late}</b></p>` : ""}<p><a href="${link}">${t.view}</a></p>`;

  return { subject: t.subject, text, html };
}