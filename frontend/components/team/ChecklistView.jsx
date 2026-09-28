"use client";
import { useTranslations } from "next-intl";
import { CircleCheck, CircleX } from "lucide-react";

// Liste ✓ / ✗ calculée par le backend (utils/checklist.js)
export default function ChecklistView({ checklist }) {
  const t = useTranslations("checklist");
  return (
    <ul className="flex flex-col gap-3">
      {checklist.map((item) => (
        <li key={item.code} className="flex items-start gap-2 text-sm">
          {item.ok ? (
            <CircleCheck className="mt-0.5 size-4 shrink-0 text-green-600" />
          ) : (
            <CircleX className="mt-0.5 size-4 shrink-0 text-red-500" />
          )}
          <span className={item.ok ? "text-slate-600" : "font-semibold text-ink"}>
            {t(item.code, item.params)}
          </span>
        </li>
      ))}
    </ul>
  );
}
