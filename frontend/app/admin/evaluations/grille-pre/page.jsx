"use client";
import RequireAuth from "@/components/auth/RequireAuth";
import AppShell from "@/components/layout/AppShell";
import GridPage from "@/components/evaluation/GridPage";

export default function GrillePrePage() {
  return (
    <RequireAuth roles={["admin"]}>
      {(user) => (
        <AppShell user={user}>
          <GridPage stage="pre" />
        </AppShell>
      )}
    </RequireAuth>
  );
}