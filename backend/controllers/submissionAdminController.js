import mongoose from "mongoose";
import Team from "../models/Team.js";
import Edition from "../models/Edition.js";
import Submission from "../models/Submission.js";
import { getCurrentEdition } from "../utils/edition.js";
import { DELIVERABLE_KINDS } from "../utils/submissionConfig.js";
import {
  getWindow, teamStatus, findVersion, sendVersionFile,
  presentItems, neutralName,
} from "../utils/submissions.js";
import { audit } from "../utils/audit.js";

const resolveEdition = (req) =>
  req.query.edition ? Edition.findById(req.query.edition) : getCurrentEdition();

const settingsOf = (edition) => ({
  toleranceMinutes: edition.submission?.toleranceMinutes ?? 0,
  anonymize: !!edition.submission?.anonymize,
});

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

// GET /api/admin/submissions : tableau de bord (F5.7)
export const adminList = async (req, res) => {
  const edition = await resolveEdition(req);
  if (!edition) return res.status(404).json({ code: "NO_EDITION" });
  const now = new Date();
  const win = getWindow(edition, now);

  const [teams, submissions] = await Promise.all([
    Team.find({ edition: edition._id, status: "valide" }).select("name").lean(),
    Submission.find({ edition: edition._id }).lean(),
  ]);
  const byTeam = new Map(submissions.map((s) => [String(s.team), s]));

  const rows = teams.map((team) => {
    const sub = byTeam.get(String(team._id));
    const items = DELIVERABLE_KINDS.map((kind) => {
      const versions = sub?.items.find((i) => i.kind === kind)?.versions ?? [];
      const last = versions.at(-1);
      return { kind, versions: versions.length, deposited: !!last, late: !!last?.late };
    });
    const lastDepositAt = (sub?.items ?? [])
      .flatMap((i) => i.versions)
      .reduce((max, v) => (!max || v.receivedAt > max ? v.receivedAt : max), null);

    return {
      id: team._id, name: team.name, anonCode: sub?.anonCode ?? null,
      status: teamStatus(sub, edition, now), items, lastDepositAt,
    };
  }).sort((a, b) => a.name.localeCompare(b.name));

  const counts = { total: rows.length, submitted: 0, late: 0, not_submitted: 0 };
  rows.forEach((r) => { counts[r.status] += 1; });

  res.json({
    now, edition: { id: edition._id, year: edition.year },
    window: { state: win.state, deadline: win.deadline, closesAt: win.closesAt },
    settings: settingsOf(edition), counts, teams: rows,
  });
};

// GET /api/admin/submissions/teams/:teamId : détail avec tout l'historique
export const adminTeamDetail = async (req, res) => {
  const edition = await resolveEdition(req);
  if (!edition) return res.status(404).json({ code: "NO_EDITION" });
  if (!mongoose.isValidObjectId(req.params.teamId)) return res.status(404).json({ code: "NOT_FOUND" });

  const team = await Team.findOne({ _id: req.params.teamId, edition: edition._id }).select("name").lean();
  if (!team) return res.status(404).json({ code: "NOT_FOUND" });

  const submission = await Submission.findOne({ edition: edition._id, team: team._id }).lean();
  res.json({
    team: { id: team._id, name: team.name },
    anonCode: submission?.anonCode ?? null,
    status: teamStatus(submission, edition),
    items: presentItems(submission?.items),
  });
};

// GET /api/admin/submissions/teams/:teamId/versions/:versionId/download
export const adminDownload = async (req, res) => {
  const edition = await resolveEdition(req);
  if (!edition) return res.status(404).json({ code: "NO_EDITION" });
  if (!mongoose.isValidObjectId(req.params.teamId)) return res.status(404).json({ code: "NOT_FOUND" });

  const submission = await Submission.findOne({ edition: edition._id, team: req.params.teamId }).lean();
  const found = findVersion(submission, req.params.versionId);
  if (!found?.version.fileName) return res.status(404).json({ code: "NOT_FOUND" });

  await audit(req, "SUBMISSION_DOWNLOAD", {
    resource: "submission", resourceId: submission._id,
    meta: { kind: found.kind, version: found.version.version, by: "admin" },
  });
  sendVersionFile(res, found.version, found.version.originalName);
};

// PATCH /api/admin/submissions/settings : { toleranceMinutes?, anonymize? } (F5.2 / F5.8)
export const updateSettings = async (req, res) => {
  const edition = await resolveEdition(req);
  if (!edition) return res.status(404).json({ code: "NO_EDITION" });

  const before = settingsOf(edition);
  const { toleranceMinutes, anonymize } = req.body;

  if (toleranceMinutes !== undefined) {
    const n = Number(toleranceMinutes);
    if (!Number.isInteger(n) || n < 0 || n > 240) return res.status(400).json({ code: "INVALID_TOLERANCE" });
    edition.set("submission.toleranceMinutes", n);
  }
  if (anonymize !== undefined) {
    if (typeof anonymize !== "boolean") return res.status(400).json({ code: "VALIDATION_ERROR" });
    edition.set("submission.anonymize", anonymize);
  }
  await edition.save();

  const after = settingsOf(edition);
  await audit(req, "SUBMISSION_SETTINGS_CHANGED", { meta: { from: before, to: after } });
  res.json({ settings: after });
};

// ---------------------------------------------------------------------------
// Jury : uniquement après la clôture, uniquement la dernière version (F5.8)
// ---------------------------------------------------------------------------

async function openJuryEdition(res) {
  const edition = await getCurrentEdition();
  if (!edition) { res.status(404).json({ code: "NO_EDITION" }); return null; }

  const win = getWindow(edition);
  if (win.state !== "closed") {
    res.status(403).json({ code: "SUBMISSIONS_STILL_OPEN", closesAt: win.closesAt });
    return null;
  }
  return edition;
}

// GET /api/jury/submissions
export const juryList = async (req, res) => {
  const edition = await openJuryEdition(res);
  if (!edition) return;
  const { anonymize } = settingsOf(edition);

  let query = Submission.find({ edition: edition._id });
  if (!anonymize) query = query.populate("team", "name");
  const submissions = await query.lean();

  const rows = submissions
    .map((s) => ({
      id: s._id,
      // Anonymisé : ni nom, ni id d'équipe, ni nom de fichier d'origine dans la réponse
      label: anonymize ? s.anonCode : s.team?.name ?? "",
      items: DELIVERABLE_KINDS.map((kind) => {
        const v = s.items.find((i) => i.kind === kind)?.versions.at(-1);
        return {
          kind,
          version: v && {
            id: v._id, version: v.version, size: v.size ?? null, mimeType: v.mimeType ?? null,
            url: v.url ?? null, receivedAt: v.receivedAt, late: !!v.late,
            name: v.fileName
              ? anonymize ? neutralName(s.anonCode, kind, v) : v.originalName
              : null,
          },
        };
      }),
    }))
    .filter((r) => r.items.some((i) => i.version))
    .sort((a, b) => a.label.localeCompare(b.label));

  res.json({ anonymized: anonymize, submissions: rows });
};

// GET /api/jury/submissions/:submissionId/versions/:versionId/download
export const juryDownload = async (req, res) => {
  const edition = await openJuryEdition(res);
  if (!edition) return;
  if (!mongoose.isValidObjectId(req.params.submissionId)) return res.status(404).json({ code: "NOT_FOUND" });

  const submission = await Submission.findOne({ _id: req.params.submissionId, edition: edition._id }).lean();
  const found = findVersion(submission, req.params.versionId);
  const latest = found && submission.items.find((i) => i.kind === found.kind).versions.at(-1);
  if (!found?.version.fileName || String(latest._id) !== String(found.version._id)) {
    return res.status(404).json({ code: "NOT_FOUND" });
  }

  const { anonymize } = settingsOf(edition);
  await audit(req, "SUBMISSION_DOWNLOAD", {
    resource: "submission", resourceId: submission._id,
    meta: { kind: found.kind, version: found.version.version, by: "jury" },
  });
  sendVersionFile(
    res, found.version,
    anonymize ? neutralName(submission.anonCode, found.kind, found.version) : found.version.originalName
  );
};