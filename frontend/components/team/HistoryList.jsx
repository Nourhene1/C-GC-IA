"use client";
import { useTranslations, useFormatter } from "next-intl";
import { History } from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import { card, sectionTitle } from "@/components/ui/styles";
import { DATE_TIME } from "@/lib/format";

// Historique des changements de statut (le plus récent en haut)
export default function HistoryList({ history }) {
  const t = useTranslations("history");
  const format = useFormatter();
  const items = [...history].reverse();

  return (
    <section className={card}>
      <h2 className={sectionTitle}><History className="size-5 text-accent" /> {t("title")}</h2>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">{t("empty")}</p>
      ) : (
        <ol className="mt-4 flex flex-col gap-4 border-l-2 border-slate-100 pl-4">
          {items.map((h, i) => (
            <li key={i} className="relative">
              <span className="absolute -left-[23px] top-1.5 size-3 rounded-full border-2 border-white bg-accent" />
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={h.status} />
                <time className="text-xs text-slate-500">{format.dateTime(new Date(h.at), DATE_TIME)}</time>
              </div>
              {/* "by" n'est détaillé que pour l'admin (populate côté backend) */}
              {h.by?.prenom && (
                <p className="mt-1 text-xs text-slate-500">{t("by", { name: `${h.by.prenom} ${h.by.nom}` })}</p>
              )}
              {h.reason && <p className="mt-1 text-sm text-ink">{h.reason}</p>}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
