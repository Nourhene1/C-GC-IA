"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations, useFormatter } from "next-intl";
import { ArrowLeft, Gavel, CircleCheck, RotateCcw, CircleX, Clock, ClipboardCheck } from "lucide-react";
import RequireAuth from "@/components/auth/RequireAuth";
import AppShell from "@/components/layout/AppShell";
import Spinner from "@/components/ui/Spinner";
import TextArea from "@/components/ui/TextArea";
import { Alert, ErrorAlert } from "@/components/ui/Alert";
import { card, sectionTitle } from "@/components/ui/styles";
import TeamInfoSection from "@/components/team/TeamInfoSection";
import MembersSection from "@/components/team/MembersSection";
import DocumentsSection from "@/components/team/DocumentsSection";
import ChecklistView from "@/components/team/ChecklistView";
import HistoryList from "@/components/team/HistoryList";
import { api } from "@/lib/api";
import { DATE_TIME } from "@/lib/format";

const ACTIONS = [
  { status: "valide", key: "validate", Icon: CircleCheck, style: "bg-green-600 hover:bg-green-700" },
  { status: "en_revision", key: "revision", Icon: RotateCcw, style: "bg-blue-600 hover:bg-blue-700" },
  { status: "rejete", key: "reject", Icon: CircleX, style: "bg-red-600 hover:bg-red-700" },
  { status: "en_attente", key: "backToPending", Icon: Clock, style: "bg-slate-500 hover:bg-slate-600" },
];

// F2.6 : panneau de décision de l'admin
function DecisionPanel({ team, onDone }) {
  const t = useTranslations("adminTeam");
  const [reason, setReason] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(null);

  const decide = async (status) => {
    if (status === "rejete" && !window.confirm(t("confirmReject"))) return;
    setBusy(status);
    setError(null);
    setSuccess(false);
    try {
      await api(`/api/admin/teams/${team._id}/status`, { method: "PATCH", body: { status, reason } });
      setReason("");
      setSuccess(true);
      await onDone();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className={card}>
      <h2 className={sectionTitle}><Gavel className="size-5 text-accent" /> {t("decision")}</h2>

      {team.status === "brouillon" ? (
        <Alert type="info" className="mt-4">{t("notSubmitted")}</Alert>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {success && <Alert type="success">{t("done")}</Alert>}
          <ErrorAlert error={error} />
          <TextArea label={t("reason")} placeholder={t("reasonPlaceholder")}
            value={reason} onChange={(e) => setReason(e.target.value)} />
          {ACTIONS.filter((a) => a.status !== team.status).map(({ status, key, Icon, style }) => (
            <button key={status} onClick={() => decide(status)} disabled={!!busy}
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:opacity-50 ${style}`}>
              <Icon className="size-4" /> {t(key)}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function TeamReview() {
  const t = useTranslations("adminTeam");
  const tc = useTranslations("checklist");
  const format = useFormatter();
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(() => api(`/api/admin/teams/${id}`).then(setData).catch(setError), [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) return <ErrorAlert error={error} />;
  if (!data) return <Spinner />;

  const { team, checklist } = data;

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/teams" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-accent">
        <ArrowLeft className="size-4" /> {t("back")}
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Mêmes composants que le chef, en lecture seule */}
          <TeamInfoSection team={team} canEdit={false} onChange={load} />
          <MembersSection team={team} canEdit={false} onChange={load} />
          <DocumentsSection team={team} canEdit={false} onChange={load} />
        </div>
        <aside className="flex flex-col gap-6">
          <DecisionPanel team={team} onDone={load} />
          <section className={card}>
            <h2 className={sectionTitle}><ClipboardCheck className="size-5 text-accent" /> {tc("title")}</h2>
            <div className="mt-4"><ChecklistView checklist={checklist} /></div>
            <p className="mt-4 text-xs text-slate-500">
              {t("createdAt")} {format.dateTime(new Date(team.createdAt), DATE_TIME)}
            </p>
          </section>
          <HistoryList history={team.history} />
        </aside>
      </div>
    </div>
  );
}

export default function AdminTeamPage() {
  return (
    <RequireAuth roles={["admin"]}>
      {(user) => (
        <AppShell user={user}>
          <TeamReview />
        </AppShell>
      )}
    </RequireAuth>
  );
}
