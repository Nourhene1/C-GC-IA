"use client";
import { CircleCheck, Clock, PencilLine } from "lucide-react";
import { useTranslations } from "next-intl";
import { EVALUATION_STATUS_STYLES } from "@/lib/evaluation";

const ICONS = { pending: Clock, draft: PencilLine, submitted: CircleCheck };

// Statut d'une évaluation : à faire / en cours / terminée
export default function EvalStatusBadge({ status }) {
  const t = useTranslations("evaluation");
  const Icon = ICONS[status] ?? Clock;
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold ${EVALUATION_STATUS_STYLES[status]}`}>
      <Icon className="size-3.5" /> {t(`status.${status}`)}
    </span>
  );
}
