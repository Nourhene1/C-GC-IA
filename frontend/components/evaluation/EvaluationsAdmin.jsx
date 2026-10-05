"use client";
import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ClipboardCheck, ListChecks, SlidersHorizontal, Trophy } from "lucide-react";
import Spinner from "@/components/ui/Spinner";
import { ErrorAlert } from "@/components/ui/Alert";
import { getEvaluationOverview, getGrid } from "@/lib/evaluation";
import TrackingPanel from "./TrackingPanel";
import GridEditor from "./GridEditor";
import ResultsPanel from "./ResultsPanel";

const TABS = [
  { key: "tracking", Icon: ListChecks },       // F6.2 / F6.6
  { key: "grid", Icon: SlidersHorizontal },    // F6.1
  { key: "results", Icon: Trophy },            // F6.4 / F6.7 / F6.8
];

// Module 6 : page admin "Évaluations"
export default function EvaluationsAdmin() {
  const t = useTranslations("evaluation");
  const [tab, setTab] = useState("tracking");
  const [overview, setOverview] = useState(null);
  const [grid, setGrid] = useState(null);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    try {
      const [o, g] = await Promise.all([getEvaluationOverview(), getGrid()]);
      setOverview(o);
      setGrid(g);
    } catch (err) {
      setError(err);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  if (!overview || !grid) return error ? <ErrorAlert error={error} /> : <Spinner />;

  return (
    <div className="flex flex-col gap-6">
      {/* ---- En-tête avec pastille d'icône et petite barre orange ---- */}
      <div>
        <h1 className="flex items-center gap-3 text-2xl font-bold text-primary">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent/10 ring-1 ring-accent/20">
            <ClipboardCheck className="size-6 text-accent" />
          </span>
          {t("admin.title")}
        </h1>
        <span className="mt-2 block h-1 w-14 rounded-full bg-accent" />
        <p className="mt-2 text-sm text-slate-500">{t("admin.subtitle", { year: overview.edition.year })}</p>
      </div>

      {/* ---- Onglets ---- */}
      <div className="flex gap-2 overflow-x-auto pb-1" role="tablist">
        {TABS.map(({ key, Icon }) => {
          const active = tab === key;
          return (
            <button key={key} role="tab" aria-selected={active} onClick={() => setTab(key)}
              className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${
                active
                  ? "bg-primary text-white ring-2 ring-accent/60"
                  : "bg-white text-primary hover:bg-accent-light hover:text-accent"
              }`}>
              <Icon className={`size-4 ${active ? "text-accent" : ""}`} /> {t(`admin.tabs.${key}`)}
            </button>
          );
        })}
      </div>

      <ErrorAlert error={error} />

      {tab === "tracking" && <TrackingPanel data={overview} onChanged={reload} />}
      {tab === "grid" && <GridEditor grid={grid.grid} locked={grid.locked} onSaved={reload} />}
      {tab === "results" && <ResultsPanel data={overview} onChanged={reload} />}
    </div>
  );
}