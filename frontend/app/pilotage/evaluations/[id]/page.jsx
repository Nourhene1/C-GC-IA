"use client";
import { use } from "react";
import RequireAuth from "@/components/auth/RequireAuth";
import AppShell from "@/components/layout/AppShell";
import StageEvaluationForm from "@/components/evaluation/StageEvaluationForm";
import {
  getPilotageEvaluation, savePilotageEvaluation, submitPilotageEvaluation,
} from "@/lib/evaluation";
import { downloadPilotageVersion } from "@/lib/submission";

const pilotageFns = {
  get: getPilotageEvaluation,
  save: savePilotageEvaluation,
  submit: submitPilotageEvaluation,
  download: downloadPilotageVersion,
};

// Next.js 15 : params est une Promise, on le lit avec use()
export default function PilotageEvaluationPage({ params }) {
  const { id } = use(params);
  return (
    <RequireAuth roles={["pilotage"]}>
      {(user) => (
        <AppShell user={user}>
          <StageEvaluationForm
            id={id}
            ns="pilotage"
            backHref="/pilotage/evaluations"
            fns={pilotageFns}
          />
        </AppShell>
      )}
    </RequireAuth>
  );
}