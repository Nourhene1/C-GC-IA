"use client";

import { useTranslations } from "next-intl";
import RequireAuth from "@/components/auth/RequireAuth";
import AppShell from "@/components/layout/AppShell";
import SubmissionSection from "@/components/team/SubmissionSection";

function TeamSubmissionPageContent() {
  const t = useTranslations("submission");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">{t("team.title")}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">{t("team.description")}</p>
      </div>
      <SubmissionSection />
    </div>
  );
}

export default function TeamSubmissionPage() {
  return (
    <RequireAuth roles={["chef", "membre"]}>
      {(user) => (
        <AppShell user={user}>
          <TeamSubmissionPageContent />
        </AppShell>
      )}
    </RequireAuth>
  );
}