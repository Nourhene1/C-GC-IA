"use client";
import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ClipboardCheck, ListChecks, SlidersHorizontal, Trophy, Gavel, ClipboardList } from "lucide-react";
import Spinner from "@/components/ui/Spinner";
import { ErrorAlert } from "@/components/ui/Alert";
import { getEvaluationOverview, getGrid } from "@/lib/evaluation";
import TrackingPanel from "./TrackingPanel";
import GridEditor from "./GridEditor";
import ResultsPanel from "./ResultsPanel";

const TABS = [
  { key: "tracking", Icon: ListChecks },
  { key: "grid", Icon: SlidersHorizontal },
];

// Les deux grilles, présentées comme sous-onglets de l'onglet "Grille d'évaluation"
const GRID_STAGES = [
  { key: "final", label: "admin.gridStages.final", Icon: Gavel },
  { key: "pre", label: "admin.gridStages.pre", Icon: ClipboardList },
];

// Onglet pill réutilisable (même style que les onglets principaux)
function PillTab({ active, onClick, Icon, children, role = "tab" }) {
  return (
    <button type="button" role={role} aria-selected={active} onClick={onClick}
      className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${
        active
          ? "bg-primary text-white ring-2 ring-accent/60"
          : "bg-white text-primary hover:bg-accent-light hover:text-accent"
      }`}>
      {Icon && <Icon className={`size-4 ${active ? "text-accent" : ""}`} />}
      {children}
    </button>
  );
}

// Module 6 : page admin "Évaluations"
export default function EvaluationsAdmin() {
  const t = useTranslations("evaluation");
  const [tab, setTab] = useState("tracking");
  const [stage, setStage] = useState("final");
  const [overview, setOverview] = useState(null);
  const [grid, setGrid] = useState(null);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const [o, g] = await Promise.all([getEvaluationOverview(stage), getGrid(stage)]);
      setOverview(o);
      setGrid(g);
    } catch (err) {
      setError(err);
    }
  }, [stage]);

  useEffect(() => { reload(); }, [reload]);

  // Changer de grille : on vide les données précédentes pour ne rien afficher de l'autre étape
  const changeStage = (next) => {
    if (next === stage) return;
    setOverview(null);
    setGrid(null);
    setStage(next);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="flex items-center gap-3 text-2xl font-bold text-primary">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent/10 ring-1 ring-accent/20">
            <ClipboardCheck className="size-6 text-accent" />
          </span>
          {t("admin.title")}
        </h1>
        <span className="mt-2 block h-1 w-14 rounded-full bg-accent" />
        {overview && (
          <p className="mt-2 text-sm text-slate-500">{t("admin.subtitle", { year: overview.edition.year })}</p>
        )}
      </div>

      {/* ---- Onglets principaux ---- */}
      <div className="flex gap-2 overflow-x-auto pb-1" role="tablist">
        {TABS.map(({ key, Icon }) => (
          <PillTab key={key} active={tab === key} onClick={() => setTab(key)} Icon={Icon}>
            {t(`admin.tabs.${key}`)}
          </PillTab>
        ))}
      </div>

      <ErrorAlert error={error} />

      {/* ---- Onglet Grille : deux grilles bien séparées ---- */}
      {tab === "grid" && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2 rounded-2xl bg-surface p-1.5" role="tablist" aria-label={t("admin.gridStageLabel")}>
            {GRID_STAGES.map(({ key, label, Icon }) => (
              <PillTab key={key} active={stage === key} onClick={() => changeStage(key)} Icon={Icon}>
                {t(label)}
              </PillTab>
            ))}
          </div>

          {!grid ? <Spinner /> : (
            <GridEditor key={`g-${stage}`} grid={grid.grid} locked={grid.locked} stage={stage} onSaved={reload} />
          )}
        </div>
      )}

      {/* ---- Autres onglets : étape affichée en rappel ---- */}
      {tab !== "grid" && (
        <p className="text-sm font-semibold text-slate-600">
          {t("admin.currentGrid")} : <span className="text-accent">{t(`admin.gridStages.${stage}`)}</span>
        </p>
      )}

      {tab === "tracking" && overview && (
        <TrackingPanel key={`t-${stage}`} data={overview} stage={stage} onChanged={reload} />
      )}
      {tab === "tracking" && !overview && !error && <Spinner />}

     
    </div>
  );
}