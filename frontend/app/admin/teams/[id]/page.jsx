"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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
  Trash2,
} from "lucide-react";

import RequireAuth from "@/components/auth/RequireAuth";
import AppShell from "@/components/layout/AppShell";
import Spinner from "@/components/ui/Spinner";
import TextArea from "@/components/ui/TextArea";
import { ErrorAlert } from "@/components/ui/Alert";
import { card, sectionTitle } from "@/components/ui/styles";
import TeamInfoSection from "@/components/team/TeamInfoSection";
import MembersSection from "@/components/team/MembersSection";
import DocumentsSection from "@/components/team/DocumentsSection";
import ChecklistView from "@/components/team/ChecklistView";
import HistoryList from "@/components/team/HistoryList";
import { api } from "@/lib/api";
import { DATE_TIME } from "@/lib/format";

// Actions de décision
// - style / header : boutons pleins utilisés dans les modales
// - button : style compact "soft" utilisé dans le panneau de décision
const ACTIONS = [
  {
    status: "valide",
    key: "validate",
    Icon: CircleCheck,
    needsReason: false,
    style: "bg-green-600 hover:bg-green-700",
    header: "bg-green-600",
    button:
      "border-green-200 bg-green-50 text-green-700 hover:border-green-600 hover:bg-green-600 hover:text-white",
  },
  {
    status: "en_revision",
    key: "revision",
    Icon: RotateCcw,
    needsReason: true,
    style: "bg-blue-600 hover:bg-blue-700",
    header: "bg-blue-600",
    button:
      "border-blue-200 bg-blue-50 text-blue-700 hover:border-blue-600 hover:bg-blue-600 hover:text-white",
  },
  {
    status: "rejete",
    key: "reject",
    Icon: CircleX,
    needsReason: true,
    style: "bg-red-600 hover:bg-red-700",
    header: "bg-red-600",
    button:
      "border-red-200 bg-red-50 text-red-700 hover:border-red-600 hover:bg-red-600 hover:text-white",
  },
  {
    status: "en_attente",
    key: "backToPending",
    Icon: Clock,
    needsReason: false,
    style: "bg-slate-500 hover:bg-slate-600",
    header: "bg-slate-600",
    button:
      "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-600 hover:bg-slate-600 hover:text-white",
  },
];

// Libellés du statut actuel
const STATUS_INFO = {
  brouillon: {
    label: "Brouillon",
    style: "bg-slate-100 text-slate-700",
  },
  en_attente: {
    label: "En attente",
    style: "bg-amber-100 text-amber-700",
  },
  valide: {
    label: "Validée",
    style: "bg-green-100 text-green-700",
  },
  rejete: {
    label: "Rejetée",
    style: "bg-red-100 text-red-700",
  },
  en_revision: {
    label: "En révision",
    style: "bg-blue-100 text-blue-700",
  },
};

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

// F2.6 — Panneau de décision de l'administrateur
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

  // Changer le statut
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

  const currentStatus =
    STATUS_INFO[team.status] || {
      label: team.status,
      style: "bg-slate-100 text-slate-700",
    };

  return (
    <section className={card}>
      <h2 className={sectionTitle}>
        <Gavel className="size-5 text-accent" />
        {t("decision")}
      </h2>

      {/* Statut actuel */}
      <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {t("currentStatus")}
        </p>

        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${currentStatus.style}`}
        >
          {t(`statuses.${team.status}`)}
        </span>
      </div>

      {/* Décisions disponibles pour tous les statuts */}
      <div className="mt-4 flex flex-col gap-3">
        <TextArea
          label={t("reason")}
          placeholder={t("reasonPlaceholder")}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-2 [&>*:last-child:nth-child(odd)]:col-span-2">
         <div className="flex flex-wrap gap-2">
  {ACTIONS.filter((a) => a.status !== team.status).map((action) => (
    <button
      key={action.status}
      type="button"
      onClick={() => ask(action)}
      disabled={!!busy}
      title={t(action.key)}
      className={`inline-flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border px-3 py-2 text-[13px] font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-50 ${action.button}`}
    >
      <action.Icon className="size-4 shrink-0" />
      {busy === action.status ? tc("loading") : t(action.key)}
    </button>
  ))}
</div>
        </div>
      </div>

      <ErrorAlert error={error} />

      {/* Confirmation de décision */}
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

      {/* Succès */}
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

// Page de consultation d'une équipe
function TeamReview() {
  const t = useTranslations("adminTeam");
  const tc = useTranslations("checklist");
  const common = useTranslations("common");
  const format = useFormatter();

  const { id } = useParams();
  const router = useRouter();

  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const load = useCallback(
    () =>
      api(`/api/admin/teams/${id}`)
        .then((response) => {
          setData(response);
          setError(null);
        })
        .catch(setError),
    [id]
  );

  useEffect(() => {
    load();
  }, [load]);

  // Suppression de l'équipe
  const handleDelete = async () => {
    setDeleteBusy(true);
    setDeleteError(null);

    try {
      await api(`/api/admin/teams/${id}`, {
        method: "DELETE",
      });

      setShowDeleteConfirm(false);
      router.push("/admin/teams");
      router.refresh();
    } catch (err) {
      setDeleteError(err);
    } finally {
      setDeleteBusy(false);
    }
  };

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

          {/* Décision */}
          <DecisionPanel
            team={team}
            onDone={load}
          />

          {/* Suppression juste sous Décision */}
          <section className="rounded-2xl border border-red-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                <Trash2 className="size-5" />
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="font-bold text-red-700">
                  {t("deleteTitle")}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {t("deleteDescription")}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setDeleteError(null);
                setShowDeleteConfirm(true);
              }}
              disabled={deleteBusy}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 className="size-4" />
              {t("deleteButton")}
            </button>
          </section>

          {/* Checklist */}
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

          {/* Historique */}
          <HistoryList history={team.history} />

        </aside>
      </div>

      {/* Confirmation de suppression */}
      {showDeleteConfirm && (
        <Modal
          header="bg-red-600"
          Icon={AlertTriangle}
          title={t("deleteConfirmTitle")}
          onClose={() => {
            if (!deleteBusy) {
              setShowDeleteConfirm(false);
              setDeleteError(null);
            }
          }}
          closable={!deleteBusy}
          footer={
            <>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteError(null);
                }}
                disabled={deleteBusy}
                className="rounded-full bg-slate-200 px-5 py-2.5 text-sm font-semibold text-primary transition hover:bg-slate-300 disabled:opacity-50"
              >
                {common("cancel")}
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteBusy}
                autoFocus
                className="inline-flex items-center gap-2 rounded-full bg-red-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                <Trash2 className="size-4" />
                {deleteBusy
                  ? t("deleteLoading")
                  : t("deleteConfirm")}
              </button>
            </>
          }
        >
          <p>
            {t("deleteConfirmMessage", { name: team.name })}
          </p>

          <p className="rounded-xl bg-red-50 px-4 py-3 text-red-700">
            {t("deleteWarning")}
          </p>

          <ErrorAlert error={deleteError} />
        </Modal>
      )}
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