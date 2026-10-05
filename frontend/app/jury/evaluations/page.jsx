"use client";

import RequireAuth from "@/components/auth/RequireAuth";
import AppShell from "@/components/layout/AppShell";
import JuryEvaluationList from "@/components/evaluation/JuryEvaluationList";

// Module 6 : équipes attribuées à l'évaluateur connecté
export default function JuryEvaluationsPage() {
  return (
    <RequireAuth roles={["jury"]}>
      {(user) => (
        <AppShell user={user}>
          <JuryEvaluationList />
        </AppShell>
      )}
    </RequireAuth>
  );
}