"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations, useFormatter } from "next-intl";
import {
  ArrowLeft,
  Gavel,
  CircleCheck,
  RotateCcw,
  CircleX,
  Clock,
  ClipboardCheck,
  X,
  AlertTriangle,
} from "lucide-react";

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

// `style` = bouton, `header` = bandeau coloré des popups,
// `confirm` = bouton de confirmation
const ACTIONS = [
  {
    status: "valide",
    key: "validate",
    Icon: CircleCheck,
    needsReason: false,
    style: "bg-green-600 hover:bg-green-700",
    header: "bg-green-600",
  },
  {
    status: "en_revision",
    key: "revision",
    Icon: RotateCcw,
    needsReason: true,
    style: "bg-blue-600 hover:bg-blue-700",
    header: "bg-blue-600",
  },
  {
    status: "rejete",
    key: "reject",
    Icon: CircleX,
    needsReason: true,
    style: "bg-red-600 hover:bg-red-700",
    header: "bg-red-600",
  },
  {
    status: "en_attente",
    key: "backToPending",
    Icon: Clock,
    needsReason: false,
    style: "bg-slate-500 hover:bg-slate-600",
    header: "bg-slate-600",
  },
];

// Popup générique
function Modal({
  header,
  Icon,
  title,
  onClose,
  closable = true,
  children,
  footer,
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      onClick={() => closable && onClose()}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl shadow-primary/20"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`relative overflow-hidden px-6 py-5 text-white ${header}`}
        >
          <span className="absolute -right-8 -top-4 h-4 w-32 rotate-[-30deg] bg-white/25" />

          <h3 className="flex items-center gap-3 text-lg font-bold">
            <Icon className="size-5" />
            {title}
          </h3>

          <button
            type="button"
            onClick={onClose}
            disabled={!closable}
            className="absolute right-4 top-4 rounded-full p-1 text-white/80 hover:bg-white/10 hover:text-white disabled:opacity-50"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex flex-col gap-3 px-6 py-6 text-sm text-slate-600">
          {children}
        </div>

        <div className="flex justify-end gap-3 bg-slate-50 px-6 py-4">
          {footer}
        </div>
      </div>
    </div>
  );
}

// F2.6 : panneau de décision de l'admin
function DecisionPanel({ team, onDone }) {
  const t = useTranslations("adminTeam");
  const tc = useTranslations("common");

  const [reason, setReason] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(null);
  const [pending, setPending] = useState(null);
  const [result, setResult] = useState(null);

  const closeConfirm = () => {
    if (busy) return;

    setPending(null);
    setError(null);
  };

  const ask = (action) => {
    setError(null);
    setPending(action);
  };

  const decide = async (action) => {
    if (action.needsReason && !reason.trim()) {
      setError({
        message: t("reasonRequired"),
      });
      return;
    }

    setBusy(action.status);
    setError(null);

    try {
      await api(`/api/admin/teams/${team._id}/status`, {
        method: "PATCH",
        body: {
          status: action.status,
          reason,
        },
      });

      setReason("");
      setPending(null);
      setResult(action);

      await onDone();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className={card}>
      <h2 className={sectionTitle}>
        <Gavel className="size-5 text-accent" />
        {t("decision")}
      </h2>

      {team.status === "brouillon" ? (
        <Alert type="info" className="mt-4">
          {t("notSubmitted")}
        </Alert>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          <TextArea
            label={t("reason")}
            placeholder={t("reasonPlaceholder")}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />

          {ACTIONS.filter((a) => a.status !== team.status).map((action) => (
            <button
              key={action.status}
              type="button"
              onClick={() => ask(action)}
              disabled={!!busy}
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:opacity-50 ${action.style}`}
            >
              <action.Icon className="size-4" />
              {t(action.key)}
            </button>
          ))}
        </div>
      )}

      {/* Popup de confirmation */}
      {pending && (
        <Modal
          header={pending.header}
          Icon={pending.Icon}
          title={t(pending.key)}
          onClose={closeConfirm}
          closable={!busy}
          footer={
            <>
              <button
                type="button"
                onClick={closeConfirm}
                disabled={!!busy}
                className="rounded-full bg-slate-200 px-5 py-2.5 text-sm font-semibold text-primary transition hover:bg-slate-300 disabled:opacity-50"
              >
                {tc("cancel")}
              </button>

              <button
                type="button"
                onClick={() => decide(pending)}
                disabled={!!busy}
                autoFocus
                className={`rounded-full px-6 py-2.5 text-sm font-semibold text-white transition disabled:opacity-50 ${pending.style}`}
              >
                {busy === pending.status
                  ? tc("loading")
                  : t(pending.key)}
              </button>
            </>
          }
        >
          <p>{t(`confirm_${pending.key}`)}</p>

          {pending.needsReason && reason.trim() && (
            <p className="rounded-xl bg-slate-50 px-4 py-3 text-slate-700">
              « {reason.trim()} »
            </p>
          )}

          <ErrorAlert error={error} />
        </Modal>
      )}

      {/* Popup de succès */}
      {result && (
        <Modal
          header={result.header}
          Icon={result.Icon}
          title={t("successTitle")}
          onClose={() => setResult(null)}
          footer={
            <button
              type="button"
              onClick={() => setResult(null)}
              autoFocus
              className={`rounded-full px-6 py-2.5 text-sm font-semibold text-white transition ${result.style}`}
            >
              {t("close")}
            </button>
          }
        >
          <p>{t("done")}</p>
        </Modal>
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

  const load = useCallback(
    () =>
      api(`/api/admin/teams/${id}`)
        .then(setData)
        .catch(setError),
    [id]
  );

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return <ErrorAlert error={error} />;
  }

  if (!data) {
    return <Spinner />;
  }

  const { team, checklist } = data;

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/teams"
        className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-accent"
      >
        <ArrowLeft className="size-4" />
        {t("back")}
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <TeamInfoSection
            team={team}
            canEdit={false}
            onChange={load}
          />

          <MembersSection
            team={team}
            canEdit={false}
            onChange={load}
          />

          <DocumentsSection
            team={team}
            canEdit={false}
            onChange={load}
          />
        </div>

        <aside className="flex flex-col gap-6">
          <DecisionPanel
            team={team}
            onDone={load}
          />

          <section className={card}>
            <h2 className={sectionTitle}>
              <ClipboardCheck className="size-5 text-accent" />
              {tc("title")}
            </h2>

            <div className="mt-4">
              <ChecklistView checklist={checklist} />
            </div>

            <p className="mt-4 text-xs text-slate-500">
              {t("createdAt")}{" "}
              {format.dateTime(
                new Date(team.createdAt),
                DATE_TIME
              )}
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