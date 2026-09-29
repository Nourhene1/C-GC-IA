"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Languages, ChevronDown } from "lucide-react";

// Champ d'un texte bilingue { fr, en } dans l'espace admin.
// L'admin écrit uniquement en français : l'anglais est traduit automatiquement
// par le backend à l'enregistrement. Un lien replié permet de voir ou corriger l'anglais.
export default function BilingualField({ label, value, onChange, multiline = false, required = false, maxLength }) {
  const t = useTranslations("adminCommon");
  const [showEn, setShowEn] = useState(false);

  const Input = multiline ? "textarea" : "input";
  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-accent focus:ring-4 focus:ring-accent/15";

  return (
    <div className="flex flex-col gap-2">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-primary">
          {label}
          {required && <span className="text-accent"> *</span>}
        </span>
        <Input className={inputClass} rows={multiline ? 6 : undefined} value={value.fr} required={required}
          maxLength={maxLength} onChange={(e) => onChange({ ...value, fr: e.target.value })} />
      </label>

      <button type="button" onClick={() => setShowEn(!showEn)} aria-expanded={showEn}
        className="inline-flex w-fit items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-accent">
        <Languages className="size-3.5" />
        {value.en ? t("showEnglish") : t("autoEnglish")}
        <ChevronDown className={`size-3.5 transition ${showEn ? "rotate-180" : ""}`} />
      </button>

      {showEn && (
        <div className="rounded-xl bg-surface p-3">
          <p className="mb-2 text-xs text-slate-500">{t("englishHint")}</p>
          <Input className={inputClass} rows={multiline ? 6 : undefined} value={value.en} maxLength={maxLength}
            aria-label={`${label} (EN)`} placeholder={t("enPlaceholder")}
            onChange={(e) => onChange({ ...value, en: e.target.value })} />
        </div>
      )}
    </div>
  );
}
