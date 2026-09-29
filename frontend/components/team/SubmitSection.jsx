"use client";
import { useState } from "react";
import { useTranslations, useFormatter } from "next-intl";
import { ClipboardCheck, Send, X } from "lucide-react";
import { ErrorAlert } from "@/components/ui/Alert";
import { btn, card, sectionTitle } from "@/components/ui/styles";
import ChecklistView from "./ChecklistView";
import { api } from "@/lib/api";
import { DATE_TIME } from "@/lib/format";

// Liste des conditions + bouton de soumission du dossier
export default function SubmitSection({ team, checklist, isChef, registrationOpen, onChange }) {
  const t = useTranslations("checklist");
  const tc = useTranslations("common");
  const format = useFormatter();
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const allOk = checklist.every((c) => c.ok);
  const canSubmitStatus =
    team.status === "en_revision" || (team.status === "brouillon" && registrationOpen);
  const showButton = isChef && ["brouillon", "en_revision"].includes(team.status);
  const isResubmit = team.status === "en_revision";

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await api("/api/teams/me/submit", { method: "POST" });
      setConfirmOpen(false);
      await onChange();
    } catch (err) {
      setConfirmOpen(false);
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={card}>
      <h2 className={sectionTitle}><ClipboardCheck className="size-5 text-accent" /> {t("title")}</h2>

      <div className="mt-4">
        <ChecklistView checklist={checklist} />
      </div>

      {team.submittedAt && team.status !== "brouillon" && (
        <p className="mt-4 text-xs text-slate-500">
          {t("submittedOn", { date: format.dateTime(new Date(team.submittedAt), DATE_TIME) })}
        </p>
      )}

      {showButton && (
        <div className="mt-6 flex flex-col gap-3">
          <ErrorAlert error={error} />
          <button
            onClick={() => setConfirmOpen(true)}
            disabled={!allOk || !canSubmitStatus || busy}
            className={`${btn.primary} w-full py-3`}
          >
            <Send className="size-4" />
            {busy ? t("submitting") : isResubmit ? t("resubmit") : t("submit")}
          </button>
          {!allOk && <p className="text-center text-xs text-slate-500">{t("notReady")}</p>}
        </div>
      )}

      {/* Popup de confirmation */}
      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          onClick={() => !busy && setConfirmOpen(false)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl shadow-primary/20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative overflow-hidden bg-primary px-6 py-5 text-white">
              <span className="absolute -right-8 -top-4 h-4 w-32 rotate-[-30deg] bg-accent" />
              <h3 className="flex items-center gap-3 text-lg font-bold">
                <Send className="size-5" /> {isResubmit ? t("resubmit") : t("submit")}
              </h3>
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={busy}
                className="absolute right-4 top-4 rounded-full p-1 text-white/80 hover:bg-white/10 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="px-6 py-6 text-sm text-slate-600">{t("confirm")}</p>

            <div className="flex justify-end gap-3 bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={busy}
                className="rounded-full bg-slate-200 px-5 py-2.5 text-sm font-semibold text-primary transition hover:bg-slate-300 disabled:opacity-50"
              >
                {tc("cancel")}
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={busy}
                autoFocus
                className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-accent disabled:opacity-50"
              >
                {busy ? t("submitting") : isResubmit ? t("resubmit") : t("submit")}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}