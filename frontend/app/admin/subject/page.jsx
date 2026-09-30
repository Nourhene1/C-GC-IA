"use client";
import RequireAuth from "@/components/auth/RequireAuth";
import AppShell from "@/components/layout/AppShell";
import SubjectManager from "@/components/admin/SubjectManager";
import AuditLogSection from "@/components/admin/Auditlogsection";

export default function AdminSubjectPage() {
  return (
    <RequireAuth roles={["admin"]}>
      {(user) => (
        <AppShell user={user}>
          <div className="flex flex-col gap-6">
            <SubjectManager />
            <AuditLogSection />
          </div>
        </AppShell>
      )}
    </RequireAuth>
  );
}