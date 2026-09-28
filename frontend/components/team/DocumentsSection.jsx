"use client";
import { useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { FileText, Upload, Eye, Trash2, CircleCheck, CircleDashed, FolderOpen } from "lucide-react";
import { ErrorAlert } from "@/components/ui/Alert";
import { btn, card, sectionTitle } from "@/components/ui/styles";
import { api, openProtectedFile } from "@/lib/api";
import { formatSize } from "@/lib/format";
import { MAX_UPLOAD_MB, DOCUMENT_ACCEPT, DOCUMENT_TYPES } from "@/lib/constants";

// Une ligne = un emplacement de pièce (ex. "Carte d'étudiant de Sara")
function DocumentSlot({ label, doc, kind, memberId, teamId, canEdit, onChange, onError }) {
  const t = useTranslations("documents");
  const tc = useTranslations("common");
  const locale = useLocale();
  const input = useRef(null);
  const [busy, setBusy] = useState(false);

  const upload = async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;

    // Vérification rapide côté navigateur (le backend revérifie toujours)
    if (!DOCUMENT_TYPES.includes(file.type)) return onError("INVALID_FILE_TYPE");
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) return onError("FILE_TOO_LARGE");

    const data = new FormData();
    data.append("kind", kind);
    if (memberId) data.append("memberId", memberId);
    data.append("file", file); // le fichier en dernier : les autres champs doivent arriver avant

    setBusy(true);
    onError(null);
    try {
      await api("/api/teams/me/documents", { method: "POST", body: data });
      await onChange();
    } catch (err) {
      onError(err);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(t("confirmDelete"))) return;
    setBusy(true);
    try {
      await api(`/api/teams/me/documents/${doc._id}`, { method: "DELETE" });
      await onChange();
    } catch (err) {
      onError(err);
    } finally {
      setBusy(false);
    }
  };

  const view = () => openProtectedFile(`/api/teams/${teamId}/documents/${doc._id}`).catch(onError);

  return (
    <li className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        {doc ? (
          <CircleCheck className="mt-0.5 size-5 shrink-0 text-green-600" />
        ) : (
          <CircleDashed className="mt-0.5 size-5 shrink-0 text-slate-400" />
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink">{label}</p>
          {doc ? (
            <p className="flex items-center gap-1 truncate text-xs text-slate-500">
              <FileText className="size-3.5 shrink-0" />
              <span className="truncate">{doc.originalName}</span>
              <span className="shrink-0">· {formatSize(doc.size, locale)}</span>
            </p>
          ) : (
            <p className="text-xs font-semibold text-amber-700">{t("missing")}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 sm:justify-end">
        {doc && (
          <button onClick={view} className={btn.ghost}>
            <Eye className="size-4" /> {tc("view")}
          </button>
        )}
        {canEdit && (
          <>
            <input ref={input} type="file" accept={DOCUMENT_ACCEPT} className="hidden" onChange={upload} />
            <button onClick={() => input.current.click()} disabled={busy} className={btn.ghost}>
              <Upload className="size-4" />
              {busy ? t("uploading") : doc ? t("replace") : t("upload")}
            </button>
          </>
        )}
        {canEdit && doc && (
          <button onClick={remove} disabled={busy} className={btn.danger} aria-label={tc("delete")} title={tc("delete")}>
            <Trash2 className="size-4" />
          </button>
        )}
      </div>
    </li>
  );
}

// F2.4 : pièces justificatives demandées par l'édition
export default function DocumentsSection({ team, canEdit, onChange }) {
  const t = useTranslations("documents");
  const [error, setError] = useState(null);

  const findDoc = (kind, memberId) =>
    team.documents.find((d) =>
      d.kind === kind && (memberId ? String(d.member) === String(memberId) : !d.member)
    );

  const kindLabel = (kind) => (t.has(`kinds.${kind}`) ? t(`kinds.${kind}`) : kind);

  return (
    <section className={card}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className={sectionTitle}><FolderOpen className="size-5 text-accent" /> {t("title")}</h2>
        <span className="text-xs text-slate-500">{t("hint", { max: MAX_UPLOAD_MB })}</span>
      </div>

      <ErrorAlert error={error} className="mt-4" />

      <div className="mt-4 flex flex-col gap-5">
        {team.edition.requiredDocuments.map((req) => (
          <div key={req.kind}>
            <h3 className="text-sm font-bold uppercase tracking-wide text-primary">
              {kindLabel(req.kind)}
              {!req.perMember && (
                <span className="ml-2 text-xs font-medium normal-case text-slate-400">({t("teamDocument")})</span>
              )}
            </h3>
            <ul className="divide-y divide-slate-100">
              {req.perMember ? (
                team.members.map((m) => (
                  <DocumentSlot key={m._id} label={`${m.prenom} ${m.nom}`} kind={req.kind} memberId={m._id}
                    doc={findDoc(req.kind, m._id)} teamId={team._id} canEdit={canEdit}
                    onChange={onChange} onError={setError} />
                ))
              ) : (
                <DocumentSlot label={kindLabel(req.kind)} kind={req.kind}
                  doc={findDoc(req.kind, null)} teamId={team._id} canEdit={canEdit}
                  onChange={onChange} onError={setError} />
              )}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
