"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Lock } from "lucide-react";
import RequireAuth from "@/components/auth/RequireAuth";
import AppShell from "@/components/layout/AppShell";
import Spinner from "@/components/ui/Spinner";
import { Alert, ErrorAlert } from "@/components/ui/Alert";
import StatusBanner from "@/components/team/StatusBanner";
import TeamInfoSection from "@/components/team/TeamInfoSection";
import MembersSection from "@/components/team/MembersSection";
import DocumentsSection from "@/components/team/DocumentsSection";
import SubmitSection from "@/components/team/SubmitSection";
import HistoryList from "@/components/team/HistoryList";
import { api } from "@/lib/api";

// F2.8 : tableau de bord de l'équipe
function TeamDashboard({ user }) {
  const t = useTranslations("teamPage");
  const router = useRouter();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  // Recharge tout le dossier (appelée après chaque modification)
  const load = useCallback(async () => {
    try {
      const res = await api("/api/teams/me");
      if (!res.team) return router.replace(user.role === "chef" ? "/team/new" : "/dashboard");
      setData(res);
    } catch (err) {
      setError(err);
    }
  }, [router, user.role]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) return <ErrorAlert error={error} />;
  if (!data) return <Spinner />;

  const { team, checklist, editable, registrationOpen } = data;
  const isChef = user.role === "chef";
  const canEdit = isChef && editable;

  return (
    <div className="flex flex-col gap-6">
      <StatusBanner team={team} registrationOpen={registrationOpen} />
      {!isChef && (
        <Alert type="info">
          <span className="inline-flex items-center gap-2"><Lock className="size-4" /> {t("readOnly")}</span>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <TeamInfoSection team={team} canEdit={canEdit} onChange={load} />
          <MembersSection team={team} canEdit={canEdit} onChange={load} />
          <DocumentsSection team={team} canEdit={canEdit} onChange={load} />
        </div>
        <aside className="flex flex-col gap-6">
          <SubmitSection team={team} checklist={checklist} isChef={isChef}
            registrationOpen={registrationOpen} onChange={load} />
          <HistoryList history={team.history} />
        </aside>
      </div>
    </div>
  );
}

export default function TeamPage() {
  return (
    <RequireAuth roles={["chef", "membre"]}>
      {(user) => (
        <AppShell user={user}>
          <TeamDashboard user={user} />
        </AppShell>
      )}
    </RequireAuth>
  );
}
