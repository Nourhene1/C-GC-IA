"use client";
import { CircleCheck, Clock, AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";

const STYLES = {
  submitted: { cls: "bg-emerald-50 text-emerald-700", Icon: CircleCheck },
  late: { cls: "bg-amber-50 text-amber-700", Icon: AlertTriangle },
  not_submitted: { cls: "bg-slate-100 text-slate-600", Icon: Clock },
};

export default function StatusBadge({ status, big = false }) {
  const t = useTranslations("submission");
  const { cls, Icon } = STYLES[status] ?? STYLES.not_submitted;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-bold ${cls} ${
        big ? "px-4 py-1.5 text-base" : "px-3 py-1 text-xs"
      }`}
    >
      <Icon className={big ? "size-5" : "size-3.5"} />
      {t(`status.${status}`)}
    </span>
  );
}