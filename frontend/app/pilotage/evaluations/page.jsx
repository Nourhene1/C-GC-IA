"use client";
import RequireAuth from "@/components/auth/RequireAuth";
import AppShell from "@/components/layout/AppShell";
import StageEvaluationList from "@/components/evaluation/StageEvaluationList";
import { getPilotageEvaluations } from "@/lib/evaluation";

export default function PilotageEvaluationsPage() {
  return (
    <RequireAuth roles={["pilotage"]}>
      {(user) => (
        <AppShell user={user}>
          <StageEvaluationList
            ns="pilotage"
            detailBase="/pilotage/evaluations"
            fetchList={getPilotageEvaluations}
          />
        </AppShell>
      )}
    </RequireAuth>
  );
}