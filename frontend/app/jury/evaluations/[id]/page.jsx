"use client";
import { use } from "react";
import RequireAuth from "@/components/auth/RequireAuth";
import AppShell from "@/components/layout/AppShell";
import StageEvaluationForm from "@/components/evaluation/StageEvaluationForm";
import { getMyEvaluation, saveMyEvaluation, submitMyEvaluation } from "@/lib/evaluation";
import { downloadJuryVersion } from "@/lib/submission";

const juryFns = {
  get: getMyEvaluation,
  save: saveMyEvaluation,
  submit: submitMyEvaluation,
  download: downloadJuryVersion,
};

export default function JuryEvaluationPage({ params }) {
  const { id } = use(params);
  return (
    <RequireAuth roles={["jury"]}>
      {(user) => (
        <AppShell user={user}>
          <StageEvaluationForm id={id} ns="jury" backHref="/jury/evaluations" fns={juryFns} />
        </AppShell>
      )}
    </RequireAuth>
  );
}