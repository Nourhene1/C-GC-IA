"use client";

import { useTranslations } from "next-intl";
import RequireAuth from "@/components/auth/RequireAuth";
import AppShell from "@/components/layout/AppShell";
import SubjectSection from "@/components/team/SubjectSection";

function TeamSubjectPageContent() {
  const t = useTranslations("subject");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm font-medium text-gray-500">
          {t("team.breadcrumb")}
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
          {t("team.title")}
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
          {t("team.description")}
        </p>
      </div>

      <SubjectSection />
    </div>
  );
}

export default function TeamSubjectPage() {
  return (
    <RequireAuth roles={["chef", "membre"]}>
      {(user) => (
        <AppShell user={user}>
          <TeamSubjectPageContent />
        </AppShell>
      )}
    </RequireAuth>
  );
}