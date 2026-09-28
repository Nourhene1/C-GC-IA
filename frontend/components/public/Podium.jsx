import { useTranslations } from "next-intl";
import { Trophy, Medal } from "lucide-react";

const MEDALS = ["text-amber-500", "text-slate-400", "text-orange-700"];

// Équipes gagnantes d'une édition
export default function Podium({ winners }) {
  const t = useTranslations("archives");
  const sorted = [...winners].sort((a, b) => a.rank - b.rank);

  return (
    <ol className="flex flex-col gap-3">
      {sorted.map((w) => (
        <li key={`${w.rank}-${w.teamName}`}
          className={`flex items-center gap-4 rounded-2xl p-4 ${w.rank === 1 ? "bg-accent-light" : "bg-surface"}`}>
          {w.rank === 1 ? (
            <Trophy className="size-8 shrink-0 text-amber-500" />
          ) : (
            <Medal className={`size-8 shrink-0 ${MEDALS[w.rank - 1] || "text-primary/40"}`} />
          )}
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase text-accent">{t("rank", { rank: w.rank })}</p>
            <p className="font-bold text-primary">{w.teamName}</p>
            {w.etablissement && <p className="text-sm text-slate-500">{w.etablissement}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
