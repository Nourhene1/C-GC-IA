"use client";
import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Spinner from "@/components/ui/Spinner";
import { ErrorAlert } from "@/components/ui/Alert";
import { getGrid } from "@/lib/evaluation";
import EvaluationsHeader from "./EvaluationsHeader";
import EvaluationsNav from "./EvaluationsNav";
import GridEditor from "./GridEditor";

// Page d'une grille : une seule étape, passée en prop
export default function GridPage({ stage }) {
  const t = useTranslations("evaluation.admin");
  const [grid, setGrid] = useState(null);
  const [error, setError] = useState(null);

  const reload = useCallback(() => {
    setError(null);
    getGrid(stage).then(setGrid).catch(setError);
  }, [stage]);

  useEffect(() => { reload(); }, [reload]);

  return (
    <div className="flex flex-col gap-6">
      <EvaluationsHeader />
      <EvaluationsNav />
      <p className="text-sm font-semibold text-slate-600">{t(`gridStages.${stage}`)}</p>
      <ErrorAlert error={error} />
      {grid ? (
        <GridEditor key={stage} grid={grid.grid} locked={grid.locked} stage={stage} onSaved={reload} />
      ) : (
        !error && <Spinner />
      )}
    </div>
  );
}