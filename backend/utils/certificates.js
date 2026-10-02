// F7.6 : attestations de participation et certificats de récompense en PDF
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import PDFDocument from "pdfkit";

const NAVY = "#173A63";
const ORANGE = "#E87722";
const GREY = "#6B7280";

// Logos repris du frontend (même dépôt) ; le PDF fonctionne aussi sans eux
const LOGO = path.resolve("..", "frontend", "public", "logo.png");
const LOGO_ISET = path.resolve("..", "frontend", "public", "logo_iset.png");

const TEXTS = {
  fr: {
    participation: "ATTESTATION DE PARTICIPATION",
    award: "CERTIFICAT DE RÉCOMPENSE",
    to: "décerné(e) à",
    member: (team, school) => `membre de l'équipe « ${team} »${school ? ` — ${school}` : ""}`,
    participationText: (title) => `pour sa participation à la ${title}.`,
    awardText: (title, rank, prize) =>
      `pour avoir obtenu la ${ordinal(rank, "fr")} place${prize ? ` (${prize})` : ""} à la ${title}.`,
    date: (d) => `Fait à Sfax, le ${d}`,
    signature: "Le comité d'organisation",
    ref: "Référence",
  },
  en: {
    participation: "CERTIFICATE OF PARTICIPATION",
    award: "CERTIFICATE OF ACHIEVEMENT",
    to: "awarded to",
    member: (team, school) => `member of team "${team}"${school ? ` — ${school}` : ""}`,
    participationText: (title) => `for taking part in the ${title}.`,
    awardText: (title, rank, prize) =>
      `for winning ${ordinal(rank, "en")} place${prize ? ` (${prize})` : ""} in the ${title}.`,
    date: (d) => `Sfax, ${d}`,
    signature: "The organising committee",
    ref: "Reference",
  },
};

function ordinal(n, lang) {
  if (lang === "en") {
    const s = ["th", "st", "nd", "rd"], v = n % 100;
    return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
  }
  return n === 1 ? "1re" : `${n}e`;
}

// Référence vérifiable : même personne + même publication = même code
export const certificateRef = (year, pubId, email, rank) =>
  `IAGC-${year}-${rank ? `R${rank}` : "P"}-${crypto.createHash("sha256").update(`${pubId}:${email}`).digest("hex").slice(0, 8).toUpperCase()}`;

// Dessine une page d'attestation
function drawPage(doc, entry, { lang, editionTitle, dateText }) {
  const T = TEXTS[lang] ?? TEXTS.fr;
  const { width: W, height: H } = doc.page;
  const award = entry.kind === "award";

  // Cadre : bandeau bleu, filet orange
  doc.rect(0, 0, W, H).fill("#FFFFFF");
  doc.lineWidth(10).strokeColor(NAVY).rect(20, 20, W - 40, H - 40).stroke();
  doc.lineWidth(2).strokeColor(ORANGE).rect(34, 34, W - 68, H - 68).stroke();

  // Logos
  if (fs.existsSync(LOGO)) doc.image(LOGO, W / 2 - 38, 58, { width: 76 });
  if (fs.existsSync(LOGO_ISET)) doc.image(LOGO_ISET, 70, 62, { height: 56 });

  doc.fillColor(award ? ORANGE : NAVY).font("Helvetica-Bold").fontSize(30)
    .text(award ? T.award : T.participation, 60, 150, { width: W - 120, align: "center", characterSpacing: 1 });
  doc.moveTo(W / 2 - 60, 196).lineTo(W / 2 + 60, 196).lineWidth(3).strokeColor(ORANGE).stroke();

  doc.fillColor(GREY).font("Helvetica").fontSize(14).text(T.to, 60, 214, { width: W - 120, align: "center" });
  doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(32).text(entry.fullName, 60, 240, { width: W - 120, align: "center" });
  doc.fillColor("#1F2937").font("Helvetica").fontSize(14)
    .text(T.member(entry.teamName, entry.etablissement), 60, 292, { width: W - 120, align: "center" });

  doc.fontSize(15).fillColor("#1F2937").text(
    award ? T.awardText(editionTitle, entry.rank, entry.prizeTitle) : T.participationText(editionTitle),
    110, 330, { width: W - 220, align: "center", lineGap: 4 }
  );

  // Pied : date à gauche, signature à droite, référence au centre
  const y = H - 130;
  doc.fillColor("#1F2937").font("Helvetica").fontSize(12).text(T.date(dateText), 80, y, { width: 260 });
  doc.moveTo(W - 300, y + 30).lineTo(W - 80, y + 30).lineWidth(1).strokeColor("#CBD5E1").stroke();
  doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(12).text(T.signature, W - 300, y + 38, { width: 220, align: "center" });
  doc.fillColor(GREY).font("Helvetica").fontSize(9)
    .text(`${T.ref} : ${entry.ref}`, 60, H - 62, { width: W - 120, align: "center" });
}

// Crée le PDF (une page par personne). Renvoie le document pdfkit (à "piper" ou à lire en Buffer).
export function certificatesPdf(entries, { lang = "fr", editionTitle, date = new Date() }) {
  const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 0, autoFirstPage: false,
    info: { Title: lang === "en" ? "Certificate" : "Attestation", Author: "Compétition IA & Génie Civil" } });
  const dateText = new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "fr-FR", { dateStyle: "long", timeZone: "Africa/Tunis" }).format(date);
  for (const entry of entries) {
    doc.addPage();
    drawPage(doc, entry, { lang, editionTitle, dateText });
  }
  doc.end();
  return doc;
}

// Même PDF en mémoire (pièce jointe d'un email)
export const certificatesBuffer = (entries, options) =>
  new Promise((resolve, reject) => {
    const doc = certificatesPdf(entries, options);
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
