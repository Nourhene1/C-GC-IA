"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Languages, LoaderCircle } from "lucide-react";
import { api } from "@/lib/api";

// Champ bilingue : une zone en français, une en anglais,
// et un bouton qui traduit automatiquement le français vers l'anglais.
export default function BilingualField({ label, value, onChange, multiline = false, required = false, maxLength }) {
  const t = useTranslations("adminCommon");
  const [translating, setTranslating] = useState(false);
  const [error, setError] = useState(false);

  const Input = multiline ? "textarea" : "input";
  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-accent focus:ring-4 focus:ring-accent/15";

  const autoTranslate = async () => {
    setTranslating(true);
    setError(false);
    try {
      const { translation } = await api("/api/admin/translate", { method: "POST", body: { text: value.fr } });
      onChange({ ...value, en: translation });
    } catch {
      setError(true);
    } finally {
      setTranslating(false);
    }
  };

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1.5 text-sm font-semibold text-primary">
        {label}
        {required && <span className="text-accent"> *</span>}
      </legend>

      <div className="flex gap-2">
        <span className="mt-3 w-7 shrink-0 text-xs font-bold text-slate-400">FR</span>
        <Input className={inputClass} rows={multiline ? 6 : undefined} value={value.fr} required={required}
          maxLength={maxLength} aria-label={`${label} (FR)`}
          onChange={(e) => onChange({ ...value, fr: e.target.value })} />
      </div>
      <div className="flex gap-2">
        <span className="mt-3 w-7 shrink-0 text-xs font-bold text-slate-400">EN</span>
        <Input className={inputClass} rows={multiline ? 6 : undefined} value={value.en}
          maxLength={maxLength} aria-label={`${label} (EN)`} placeholder={t("enPlaceholder")}
          onChange={(e) => onChange({ ...value, en: e.target.value })} />
      </div>

      <div className="ml-9 flex flex-wrap items-center gap-3">
        <button type="button" onClick={autoTranslate} disabled={!value.fr?.trim() || translating}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline disabled:opacity-40 disabled:no-underline">
          {translating ? <LoaderCircle className="size-3.5 animate-spin" /> : <Languages className="size-3.5" />}
          {t("translate")}
        </button>
        {error && <span className="text-xs text-red-600">{t("translateError")}</span>}
      </div>
    </fieldset>
  );
}
