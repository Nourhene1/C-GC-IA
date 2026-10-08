"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Trash2, ArrowUp, ArrowDown, Lock, Save, Settings2 } from "lucide-react";
import { Alert, ErrorAlert } from "@/components/ui/Alert";
import { btn, card, sectionTitle } from "@/components/ui/styles";
import TextPair, { smallInput } from "@/components/admin/content/TextPair";
import { saveGrid, saveEvaluationSettings } from "@/lib/evaluation";

// Clé locale pour les éléments pas encore enregistrés (React a besoin d'une clé stable)
let counter = 0;
const withKey = (x) => ({ ...x, key: x._id || `new-${++counter}` });
const emptyText = () => ({ fr: "", en: "" });
const newSub = () => withKey({ label: emptyText(), description: emptyText(), max: 10 });
const newCriterion = () => withKey({ label: emptyText(), description: emptyText(), weight: 0, max: 10, subCriteria: [] });

// Petit champ numérique (pondération, note maximale, barème)
const numberInput =
  "w-24 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-right text-sm outline-none focus:border-accent focus:ring-4 focus:ring-accent/15 disabled:bg-slate-50";

// Boutons monter / descendre / supprimer d'un élément de liste
function MoveButtons({ index, length, onMove, onRemove }) {
  const t = useTranslations("evaluation");
  return (
    <div className="flex items-center gap-1">
      <button type="button" className={btn.ghost} onClick={() => onMove(-1)} disabled={index === 0} aria-label={t("grid.moveUp")}>
        <ArrowUp className="size-4" />
      </button>
      <button type="button" className={btn.ghost} onClick={() => onMove(1)} disabled={index === length - 1} aria-label={t("grid.moveDown")}>
        <ArrowDown className="size-4" />
      </button>
      <button type="button" className={btn.danger} onClick={onRemove} aria-label={t("grid.remove")}>
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}

const move = (list, i, dir) => {
  const next = [...list];
  [next[i], next[i + dir]] = [next[i + dir], next[i]];
  return next;
};

// Un critère et ses sous-critères
function CriterionCard({ criterion, index, length, onChange, onMove, onRemove }) {
  const t = useTranslations("evaluation");
  const update = (patch) => onChange({ ...criterion, ...patch });
  const subs = criterion.subCriteria;
  const setSubs = (subCriteria) => update({ subCriteria });
  const subTotal = subs.reduce((s, x) => s + (Number(x.max) || 0), 0);

  return (
    <div className="rounded-2xl border border-slate-200 p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-white">
          {t("grid.criterionN", { n: index + 1 })}
        </span>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-primary">
            {t("grid.weight")}
            <input type="number" min="0" max="100" step="any" required className={numberInput}
              value={criterion.weight} onChange={(e) => update({ weight: e.target.value })} />
            %
          </label>
          <MoveButtons index={index} length={length} onMove={onMove} onRemove={onRemove} />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <TextPair label={t("grid.criterionLabel")} required value={criterion.label} onChange={(label) => update({ label })} />
        <TextPair label={t("grid.description")} multiline value={criterion.description} onChange={(description) => update({ description })} />
      </div>

      <div className="mt-5 rounded-xl bg-surface p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-primary">{t("grid.subCriteria")}</p>
          {subs.length > 0 && <p className="text-xs text-slate-500">{t("grid.subTotal", { max: subTotal })}</p>}
        </div>

        {subs.length === 0 && (
          <label className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
            {t("grid.noSubHint")}
            <input type="number" min="0.5" step="any" required className={numberInput}
              value={criterion.max} onChange={(e) => update({ max: e.target.value })} />
            {t("grid.points")}
          </label>
        )}

        <div className="flex flex-col gap-3">
          {subs.map((sub, i) => (
            <div key={sub.key} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-start">
              <div className="min-w-0 flex-1">
                <TextPair label={t("grid.subLabel", { n: i + 1 })} required value={sub.label}
                  onChange={(label) => setSubs(subs.map((s, j) => (j === i ? { ...s, label } : s)))} />
              </div>
              <div className="flex items-end gap-2 sm:pt-5">
                <label className="flex items-center gap-2 text-sm font-semibold text-primary">
                  /
                  <input type="number" min="0.5" step="any" required className={numberInput} aria-label={t("grid.max")}
                    value={sub.max} onChange={(e) => setSubs(subs.map((s, j) => (j === i ? { ...s, max: e.target.value } : s)))} />
                </label>
                <MoveButtons index={i} length={subs.length}
                  onMove={(dir) => setSubs(move(subs, i, dir))}
                  onRemove={() => setSubs(subs.filter((_, j) => j !== i))} />
              </div>
            </div>
          ))}
        </div>

        <button type="button" className={`${btn.ghost} mt-3`} onClick={() => setSubs([...subs, newSub()])}>
          <Plus className="size-4" /> {t("grid.addSub")}
        </button>
      </div>
    </div>
  );
}



// F6.1 : paramétrage de la grille (critères, sous-critères, pondérations, barème)
export default function GridEditor({ grid: initial, locked, onSaved }) {
  const t = useTranslations("evaluation");
  const [grid, setGrid] = useState(initial);
  const [scale, setScale] = useState(initial.scale);
  const [criteria, setCriteria] = useState(() =>
    initial.criteria.map((c) => withKey({ ...c, subCriteria: c.subCriteria.map(withKey) }))
  );
  const [state, setState] = useState({ busy: false, error: null, saved: false });

  const weightSum = Math.round(criteria.reduce((s, c) => s + (Number(c.weight) || 0), 0) * 100) / 100;
  const setAt = (i, c) => setCriteria(criteria.map((x, j) => (j === i ? c : x)));

  const submit = async (e) => {
    e.preventDefault();
    setState({ busy: true, error: null, saved: false });
    try {
      const res = await saveGrid({ scale: Number(scale), criteria });
      setGrid(res.grid);
      setCriteria(res.grid.criteria.map((c) => withKey({ ...c, subCriteria: c.subCriteria.map(withKey) })));
      onSaved?.(res.grid);
      setState({ busy: false, error: null, saved: true });
    } catch (error) {
      setState({ busy: false, error, saved: false });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={submit} className={card}>
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className={sectionTitle}>{t("grid.title")}</h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">{t("grid.hint")}</p>
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold text-primary">
            {t("grid.scale")}
            <span className="text-slate-400">/</span>
            <input type="number" min="1" max="1000" required className={numberInput} disabled={locked}
              value={scale} onChange={(e) => setScale(e.target.value)} />
          </label>
        </div>

        {locked && (
          <Alert type="info" className="mb-5">
            <span className="inline-flex items-center gap-1.5 font-semibold"><Lock className="size-4" /> {t("grid.locked")}</span>
          </Alert>
        )}

        <fieldset disabled={locked} className="flex flex-col gap-4">
          {criteria.length === 0 && (
            <p className="rounded-xl border border-dashed border-slate-300 px-6 py-8 text-center text-sm text-slate-500">
              {t("grid.empty")}
            </p>
          )}
          {criteria.map((c, i) => (
            <CriterionCard key={c.key} criterion={c} index={i} length={criteria.length}
              onChange={(next) => setAt(i, next)}
              onMove={(dir) => setCriteria(move(criteria, i, dir))}
              onRemove={() => setCriteria(criteria.filter((_, j) => j !== i))} />
          ))}
          {!locked && (
            <button type="button" className={`${btn.outline} self-start`} onClick={() => setCriteria([...criteria, newCriterion()])}>
              <Plus className="size-4" /> {t("grid.addCriterion")}
            </button>
          )}
        </fieldset>

        <div className="mt-6 flex flex-col gap-3">
          <ErrorAlert error={state.error} />
          {state.saved && <Alert type="success">{t("grid.saved")}</Alert>}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-5">
          <p className={`text-sm font-bold ${weightSum === 100 ? "text-emerald-600" : "text-amber-600"}`}>
            {t("grid.weightSum", { sum: weightSum })}
          </p>
          {!locked && (
            <button type="submit" disabled={state.busy} className={btn.primary}>
              <Save className="size-4" /> {state.busy ? t("saving") : t("grid.save")}
            </button>
          )}
        </div>
      </form>

    </div>
  );
}
