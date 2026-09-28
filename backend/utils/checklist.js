// Liste des conditions à remplir avant de soumettre le dossier.
// Utilisée par le backend (pour bloquer la soumission) et renvoyée
// au frontend (pour afficher la liste ✓ / ✗ au chef d'équipe).

export function getMissingDocuments(team, edition) {
  const missing = [];
  const has = (kind, memberId) =>
    team.documents.some((d) =>
      d.kind === kind && (memberId ? String(d.member) === String(memberId) : !d.member)
    );

  for (const req of edition.requiredDocuments) {
    if (req.perMember) {
      for (const m of team.members) {
        if (!has(req.kind, m._id)) missing.push({ kind: req.kind, member: m._id });
      }
    } else if (!has(req.kind, null)) {
      missing.push({ kind: req.kind, member: null });
    }
  }
  return missing;
}

export function getChecklist(team, edition) {
  const { min, max } = edition.teamSize;
  const count = team.members.length;
  const incomplete = team.members.filter((m) => !m.niveau || !m.filiere).length;
  const missingDocs = getMissingDocuments(team, edition).length;

  return [
    { code: "MEMBERS_COUNT", ok: count >= min && count <= max, params: { count, min, max } },
    { code: "MEMBERS_INFO",  ok: incomplete === 0, params: { count: incomplete } },
    { code: "DOCUMENTS",     ok: missingDocs === 0, params: { count: missingDocs } },
  ];
}

export const isChecklistOk = (checklist) => checklist.every((item) => item.ok);
