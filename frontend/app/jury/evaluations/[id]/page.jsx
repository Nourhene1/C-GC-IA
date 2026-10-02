"use client";

import { useParams } from "next/navigation";
import RequireAuth from "@/components/auth/RequireAuth";
import AppShell from "@/components/layout/AppShell";
import JuryEvaluationForm from "@/components/evaluation/JuryEvaluationForm";

// Module 6 : saisie des notes d'une équipe (F6.3)
export default function JuryEvaluationPage() {
  const { id } = useParams();
  return (
    <RequireAuth roles={["jury"]}>
      {(user) => (
        <AppShell user={user}>
          <div className="mx-auto max-w-5xl">
            <JuryEvaluationForm id={id} />
          </div>
        </AppShell>
      )}
    </RequireAuth>
  );
}