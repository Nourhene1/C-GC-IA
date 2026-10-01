"use client";

import RequireAuth from "@/components/auth/RequireAuth";
import AppShell from "@/components/layout/AppShell";
import JurySubmissions from "@/components/jury/JurySubmissions";

export default function JurySubmissionsPage() {
  return (
    <RequireAuth roles={["jury"]}>
      {(user) => (
        <AppShell user={user}>
          <JurySubmissions />
        </AppShell>
      )}
    </RequireAuth>
  );
}