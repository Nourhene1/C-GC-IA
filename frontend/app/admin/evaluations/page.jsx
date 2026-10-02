"use client";

import RequireAuth from "@/components/auth/RequireAuth";
import AppShell from "@/components/layout/AppShell";
import EvaluationsAdmin from "@/components/evaluation/EvaluationsAdmin";

// Module 6 : grille, affectations, suivi et résultats des évaluations
export default function AdminEvaluationsPage() {
  return (
    <RequireAuth roles={["admin"]}>
      {(user) => (
        <AppShell user={user}>
          <EvaluationsAdmin />
        </AppShell>
      )}
    </RequireAuth>
  );
}