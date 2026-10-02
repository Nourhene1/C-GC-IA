"use client";

import RequireAuth from "@/components/auth/RequireAuth";
import AppShell from "@/components/layout/AppShell";
import ResultsAdmin from "@/components/results/ResultsAdmin";

// Module 7 : classement, publication, attestations
export default function AdminResultsPage() {
  return (
    <RequireAuth roles={["admin"]}>
      {(user) => (
        <AppShell user={user}>
          <ResultsAdmin />
        </AppShell>
      )}
    </RequireAuth>
  );
}
