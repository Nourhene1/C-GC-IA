"use client";
import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import RequireAuth from "@/components/auth/RequireAuth";
import AppShell from "@/components/layout/AppShell";
import Spinner from "@/components/ui/Spinner";
import { ErrorAlert } from "@/components/ui/Alert";
import { getEvaluationOverview } from "@/lib/evaluation";
import EvaluationsHeader from "@/components/evaluation/EvaluationsHeader";
import EvaluationsNav from "@/components/evaluation/EvaluationsNav";
import TrackingPanel from "@/components/evaluation/TrackingPanel";

// Les deux étapes affichées sur la page de suivi, chacune avec ses évaluateurs
const STAGE_SECTIONS = [
  { stage: "final", titleKey: "admin.trackingFinal" },
  { stage: "pre", titleKey: "admin.trackingPre" },
];

export default function EvaluationsTrackingPage() {
  const t = useTranslations("evaluation");
  const [overviews, setOverviews] = useState({});
  const [error, setError] = useState(null);

  // Charge l'aperçu des deux étapes en parallèle
  const reload = useCallback(async () => {
    setError(null);
    try {
      const [final, pre] = await Promise.all(
        STAGE_SECTIONS.map(({ stage }) => getEvaluationOverview(stage))
      );
      setOverviews({ final, pre });
    } catch (err) {
      setError(err);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const subtitleSource = overviews.final ?? overviews.pre;

  return (
    <RequireAuth roles={["admin"]}>
      {(user) => (
        <AppShell user={user}>
          <div className="flex flex-col gap-10">
            <EvaluationsHeader
              subtitle={subtitleSource && t("admin.subtitle", { year: subtitleSource.edition.year })}
            />
            <EvaluationsNav />
            <ErrorAlert error={error} />

            {STAGE_SECTIONS.map(({ stage, titleKey }) => (
              <section key={stage} className="flex flex-col gap-4">
                <h2 className="text-lg font-bold text-primary">{t(titleKey)}</h2>
                {overviews[stage] ? (
                  <TrackingPanel
                    key={stage}
                    data={overviews[stage]}
                    stage={stage}
                    onChanged={reload}
                  />
                ) : (
                  !error && <Spinner />
                )}
              </section>
            ))}
          </div>
        </AppShell>
      )}
    </RequireAuth>
  );
}