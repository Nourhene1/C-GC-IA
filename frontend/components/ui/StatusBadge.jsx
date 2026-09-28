"use client";
import { useTranslations } from "next-intl";

export const STATUS_STYLES = {
  brouillon:   "bg-slate-100 text-slate-700",
  en_attente:  "bg-amber-100 text-amber-800",
  valide:      "bg-green-100 text-green-800",
  rejete:      "bg-red-100 text-red-700",
  en_revision: "bg-blue-100 text-blue-800",
};

export default function StatusBadge({ status, className = "" }) {
  const t = useTranslations("status");
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLES[status]} ${className}`}>
      {t(status)}
    </span>
  );
}
