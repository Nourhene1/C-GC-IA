// Module 7 : publication des résultats, attestations, notifications
import Ranking from "../models/Ranking.js";
import Edition from "../models/Edition.js";
import EditionContent from "../models/EditionContent.js";
import Team from "../models/Team.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import { sendMailSafe } from "./mailer.js";
import { resultsMail } from "./resultsEmails.js";
import { certificatesBuffer, certificateRef } from "./certificates.js";

export const ACTIVE = ["scheduled", "published"];

const norm = (email) => String(email ?? "").trim().toLowerCase();

// Publication en cours (programmée ou publiée, non retirée)
export const activePublication = (editionId) =>
  Ranking.findOne({ edition: editionId, status: { $in: ACTIVE } }).sort({ version: -1 });

// F7.4 : tant qu'une publication est active, les notes ne peuvent plus changer
export const resultsLocked = (edition) =>
  Ranking.exists({ edition: edition._id, status: { $in: ACTIVE } }).then(Boolean);

// Publication visible par le public (l'heure de publication est atteinte)
export const publicPublication = (editionId) =>
  Ranking.findOne({ edition: editionId, status: { $in: ACTIVE }, publishAt: { $lte: new Date() } }).sort({ version: -1 });

export const editionTitle = (edition, lang) =>
  (lang === "en" && edition.title?.en) || edition.title?.fr || `Compétition IA & Génie Civil ${edition.year}`;

// F7.6 : UNE attestation par personne et par publication.
// - équipe dans le podium choisi par l'admin (rang <= podiumSize) -> RÉCOMPENSE, avec le rang
// - toutes les autres (y compris non classées)                    -> PARTICIPATION, sans rang
// Si une personne apparaît plusieurs fois (deux équipes, doublon, casse de l'email),
// on garde la meilleure : récompense > participation, puis le meilleur rang.
// filter : { teamId } (une équipe) ou { email } (une seule personne)
export async function certificateEntries(pub, edition, filter = {}) {
  const rows = pub.rows.filter((r) => !filter.teamId || String(r.team) === String(filter.teamId));
  const [teams, content] = await Promise.all([
    Team.find({ _id: { $in: rows.map((r) => r.team) } }).select("name etablissement members").lean(),
    EditionContent.findOne({ edition: edition._id }).select("prizes").lean(),
  ]);
  const teamById = new Map(teams.map((t) => [String(t._id), t]));
  const podium = pub.settings?.podiumSize ?? 3; // valeur choisie par l'admin
  const wanted = filter.email ? norm(filter.email) : null;

  const best = new Map(); // email normalisé -> entrée retenue
  for (const row of rows) {
    const team = teamById.get(String(row.team));
    if (!team) continue;
    const award = row.rank !== null && row.rank <= podium;
    const prize = award ? content?.prizes?.find((p) => p.rank === row.rank) : null;

    for (const m of team.members ?? []) {
      if (!m?.email) continue;
      const key = norm(m.email);
      if (wanted && key !== wanted) continue;

      const entry = {
        email: m.email,
        fullName: `${m.prenom} ${m.nom}`,
        teamName: team.name,
        etablissement: team.etablissement,
        kind: award ? "award" : "participation",
        rank: award ? row.rank : null, // pas de rang pour les non-gagnants
        prizeTitle: prize?.title ?? null, // { fr, en } : choisi selon la langue
        ref: certificateRef(edition.year, pub._id, m.email, award ? row.rank : null),
      };

      const current = best.get(key);
      const better =
        !current ||
        (entry.kind === "award" && current.kind !== "award") ||
        (entry.kind === "award" && current.kind === "award" && entry.rank < current.rank);
      if (better) best.set(key, entry);
    }
  }
  return [...best.values()];
}

// Le titre du prix dans la bonne langue
export const localizeEntries = (entries, lang) =>
  entries.map((e) => ({ ...e, prizeTitle: (lang === "en" && e.prizeTitle?.en) || e.prizeTitle?.fr || null }));

// F7.8 : le podium est recopié dans l'historique de l'édition (rubrique Archives)
async function updateWinners(pub, edition) {
  const podium = pub.settings?.podiumSize ?? 3;
  edition.winners = pub.rows
    .filter((r) => r.rank !== null && r.rank <= podium)
    .map((r) => ({ rank: r.rank, teamName: r.name, etablissement: r.etablissement || "" }));
  await edition.save();
}

// Prévient TOUS les participants (in-app + email) et envoie leur attestation en pièce jointe
export async function notifyResults(pub, edition) {
  const entries = await certificateEntries(pub, edition);
  if (entries.length === 0) return 0;

  const users = await User.find({ email: { $in: entries.map((e) => e.email) } }).select("email locale").lean();
  const userOf = new Map(users.map((u) => [norm(u.email), u]));
  if (users.length) {
    await Notification.insertMany(users.map((u) => ({
      user: u._id, type: "results_published",
      title: { fr: "Résultats publiés", en: "Results published" },
      body: { fr: "Le classement officiel est en ligne.", en: "The official ranking is online." },
      link: "/resultats",
    })));
  }

  const link = `${process.env.FRONTEND_URL}/resultats`;
  const withCertificate = pub.settings?.sendCertificates !== false;
  const title = { fr: editionTitle(edition, "fr"), en: editionTitle(edition, "en") };

  let sent = 0;
  for (const entry of entries) {
    try {
      const locale = userOf.get(norm(entry.email))?.locale === "en" ? "en" : "fr";
      const attachments = withCertificate
        ? [{
            filename: locale === "en" ? "certificate.pdf" : "attestation.pdf",
            content: await certificatesBuffer(localizeEntries([entry], locale), { lang: locale, editionTitle: title[locale], date: pub.publishAt }),
            contentType: "application/pdf",
          }]
        : undefined;
      await sendMailSafe({
        to: entry.email,
        attachments,
        ...resultsMail({
          name: entry.fullName, teamName: entry.teamName, rank: entry.rank,
          award: entry.kind === "award", withCertificate, locale, link,
        }),
      });
      sent++;
    } catch (err) {
      // une attestation en échec ne doit pas bloquer les autres participants
      console.error(`Envoi des résultats à ${entry.email} :`, err.message);
    }
  }
  return sent;
}

// À l'heure prévue : publication effective, archives, notifications (une seule fois)
export async function runResultsPublication() {
  const due = await Ranking.find({ status: "scheduled", publishAt: { $lte: new Date() } }).select("_id");
  for (const { _id } of due) {
    // Réservation atomique : un seul traitement s'occupe de cette publication
    const pub = await Ranking.findOneAndUpdate({ _id, status: "scheduled" }, { status: "published" }, { new: true });
    if (!pub) continue;
    const edition = await Edition.findById(pub.edition);
    if (!edition) continue;

    await updateWinners(pub, edition);
    const count = await notifyResults(pub, edition);
    pub.notifiedAt = new Date();
    await pub.save();
    console.log(`🏆 Résultats ${edition.year} (version ${pub.version}) publiés — ${count} participant(s) prévenu(s)`);
  }
}

export function startResultsScheduler() {
  const tick = () => runResultsPublication().catch((err) => console.error("Publication des résultats :", err.message));
  tick();
  return setInterval(tick, 60 * 1000); // toutes les minutes
}