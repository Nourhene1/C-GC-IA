"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";

// Petit champ de texte bilingue pour les listes (titre d'un prix, rôle d'un juré…).
// L'admin écrit en français ; l'anglais est traduit automatiquement à l'enregistrement.
// Le bouton "EN" permet de voir ou corriger la traduction.
const input =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-4 focus:ring-accent/15";

export default function TextPair({ label, value = {}, onChange, required = false, multiline = false }) {
  const t = useTranslations("adminCommon");
  const [showEn, setShowEn] = useState(false);
  const Input = multiline ? "textarea" : "input";

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <label className="text-xs font-semibold text-primary">
          {label}{required && <span className="text-accent"> *</span>}
        </label>
        <button type="button" onClick={() => setShowEn(!showEn)} aria-expanded={showEn}
          title={t("showEnglish")}
          className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${showEn ? "bg-primary text-white" : "bg-surface text-slate-500 hover:text-accent"}`}>
          EN
        </button>
      </div>
      <Input className={input} rows={multiline ? 2 : undefined} aria-label={label}
        value={value.fr || ""} required={required} onChange={(e) => onChange({ ...value, fr: e.target.value })} />
      {showEn && (
        <Input className={`${input} mt-2 bg-surface`} rows={multiline ? 2 : undefined} aria-label={`${label} (EN)`}
          placeholder={t("enPlaceholder")} value={value.en || ""} onChange={(e) => onChange({ ...value, en: e.target.value })} />
      )}
    </div>
  );
}

export const smallInput = input;
