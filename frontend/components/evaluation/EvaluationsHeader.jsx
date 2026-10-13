"use client";
import { useTranslations } from "next-intl";
import { ClipboardCheck } from "lucide-react";

export default function EvaluationsHeader({ subtitle }) {
  const t = useTranslations("evaluation");
  return (
    <div>
      <h1 className="flex items-center gap-3 text-2xl font-bold text-primary">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent/10 ring-1 ring-accent/20">
          <ClipboardCheck className="size-6 text-accent" />
        </span>
        {t("admin.title")}
      </h1>
      <span className="mt-2 block h-1 w-14 rounded-full bg-accent" />
      {subtitle && <p className="mt-2 text-sm text-slate-500">{subtitle}</p>}
    </div>
  );
}