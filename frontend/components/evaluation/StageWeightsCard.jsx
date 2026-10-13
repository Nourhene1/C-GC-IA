"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Scale, Save, Lock } from "lucide-react";
import { Alert, ErrorAlert } from "@/components/ui/Alert";
import Spinner from "@/components/ui/Spinner";
import { btn, card, sectionTitle } from "@/components/ui/styles";
import { smallInput } from "@/components/admin/content/TextPair";
import { getStageWeights, saveStageWeights } from "@/lib/evaluation";

const round2 = (n) => Math.round(n * 100) / 100;

// Pondération des étapes dans la note totale (%). Stockée sur la grille finale.
// locked : vrai dès qu'une publication est active (le serveur refuse la modification).
export default function StageWeightsCard({ locked = false, onSaved }) {
  const t = useTranslations("results.admin.weights");
  const [form, setForm] = useState(null); // { pre: string, final: string }
  const [loadError, setLoadError] = useState(null);
  const [state, setState] = useState({ busy: false, error: null, saved: false });

  useEffect(() => {
    getStageWeights()
      .then(({ weights }) => setForm({ pre: String(weights.pre), final: String(weights.final) }))
      .catch(setLoadError);
  }, []);

  if (!form) return loadError ? <ErrorAlert error={loadError} /> : <Spinner />;

  const filled = form.pre !== "" && form.final !== "";
  const pre = Number(form.pre);
  const final = Number(form.final);
  const sum = round2(pre + final);
  const inRange = [pre, final].every((n) => Number.isFinite(n) && n >= 0 && n <= 100);
  const valid = filled && inRange && sum === 100;

  // Modifier un poids ajuste automatiquement l'autre, pour que la somme reste à 100
  const setPre = (v) => setForm({ pre: v, final: String(round2(100 - Number(v || 0))) });
  const setFinal = (v) => setForm({ pre: String(round2(100 - Number(v || 0))), final: v });

  const submit = async (e) => {
    e.preventDefault();
    setState({ busy: true, error: null, saved: false });
    try {
      const res = await saveStageWeights({ pre, final });
      setForm({ pre: String(res.weights.pre), final: String(res.weights.final) });
      await onSaved?.();
      setState({ busy: false, error: null, saved: true });
    } catch (error) {
      setState({ busy: false, error, saved: false });
    }
  };

  return (
    <form onSubmit={submit} className={card}>
      <h2 className={sectionTitle}><Scale className="size-5 text-accent" /> {t("title")}</h2>
      <p className="mt-1 text-sm text-slate-500">{t("hint")}</p>

      <fieldset disabled={locked} className="mt-4 grid gap-4 sm:grid-cols-3">
        <label className="block text-sm">
          <span className="mb-1.5 block font-semibold text-primary">{t("pre")}</span>
          <div className="flex items-center gap-2">
            <input type="number" min="0" max="100" step="any" required className={smallInput}
              value={form.pre} onChange={(e) => setPre(e.target.value)} />
            <span className="text-sm text-slate-500">%</span>
          </div>
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-semibold text-primary">{t("final")}</span>
          <div className="flex items-center gap-2">
            <input type="number" min="0" max="100" step="any" required className={smallInput}
              value={form.final} onChange={(e) => setFinal(e.target.value)} />
            <span className="text-sm text-slate-500">%</span>
          </div>
        </label>
        <p className={`self-end text-sm font-bold ${valid ? "text-emerald-600" : "text-amber-600"}`}>
          {t("sum", { sum: filled ? sum : 0 })}
        </p>
      </fieldset>

      {locked && (
        <p className="mt-4 flex items-center gap-1.5 text-sm text-slate-600">
          <Lock className="size-3.5" /> {t("lockedHint")}
        </p>
      )}

      <div className="mt-4 flex flex-col gap-3">
        <ErrorAlert error={state.error} />
        {state.saved && <Alert type="success">{t("saved")}</Alert>}
      </div>

      {!locked && (
        <button type="submit" disabled={state.busy || !valid} className={`${btn.secondary} mt-4`}>
          <Save className="size-4" /> {state.busy ? t("saving") : t("save")}
        </button>
      )}
    </form>
  );
}