"use client";
import { useState } from "react";
import { useTranslations, useFormatter } from "next-intl";
import { ClipboardCheck, Send } from "lucide-react";
import { ErrorAlert } from "@/components/ui/Alert";
import { btn, card, sectionTitle } from "@/components/ui/styles";
import ChecklistView from "./ChecklistView";
import { api } from "@/lib/api";
import { DATE_TIME } from "@/lib/format";

// Liste des conditions + bouton de soumission du dossier
export default function SubmitSection({ team, checklist, isChef, registrationOpen, onChange }) {
  const t = useTranslations("checklist");
  const format = useFormatter();
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const allOk = checklist.every((c) => c.ok);
  const canSubmitStatus =
    team.status === "en_revision" || (team.status === "brouillon" && registrationOpen);
  const showButton = isChef && ["brouillon", "en_revision"].includes(team.status);

  const submit = async () => {
    if (!window.confirm(t("confirm"))) return;
    setBusy(true);
    setError(null);
    try {
      await api("/api/teams/me/submit", { method: "POST" });
      await onChange();
    } catch (err) {
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
          <button onClick={submit} disabled={!allOk || !canSubmitStatus || busy} className={`${btn.primary} w-full py-3`}>
            <Send className="size-4" />
            {busy ? t("submitting") : team.status === "en_revision" ? t("resubmit") : t("submit")}
          </button>
          {!allOk && <p className="text-center text-xs text-slate-500">{t("notReady")}</p>}
        </div>
      )}
    </section>
  );
}
