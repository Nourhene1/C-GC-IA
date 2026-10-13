"use client";
import RequireAuth from "@/components/auth/RequireAuth";
import AppShell from "@/components/layout/AppShell";
import StageEvaluationList from "@/components/evaluation/StageEvaluationList";
import { getMyEvaluations } from "@/lib/evaluation";

export default function JuryEvaluationsPage() {
  return (
    <RequireAuth roles={["jury"]}>
      {(user) => (
        <AppShell user={user}>
          <StageEvaluationList ns="jury" detailBase="/jury/evaluations" fetchList={getMyEvaluations} />
        </AppShell>
      )}
    </RequireAuth>
  );
}