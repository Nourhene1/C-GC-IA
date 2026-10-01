"use client";

import RequireAuth from "@/components/auth/RequireAuth";
import AppShell from "@/components/layout/AppShell";
import SubmissionsDashboard from "@/components/admin/SubmissionsDashboard";

export default function AdminSubmissionsPage() {
  return (
    <RequireAuth roles={["admin"]}>
      {(user) => (
        <AppShell user={user}>
          <SubmissionsDashboard />
        </AppShell>
      )}
    </RequireAuth>
  );
}