import { useTranslations } from "next-intl";
import { Trophy, Medal } from "lucide-react";

const MEDAL = { 1: "text-amber-500", 2: "text-slate-400", 3: "text-orange-700" };

// Classement complet (page Résultats et Archives). Fonctionne côté serveur et côté client.
export default function RankingTable({ rows, scale, showScores = true }) {
  const t = useTranslations("results");
  return (
    <div className="overflow-x-auto rounded-2xl bg-white shadow-lg shadow-primary/5">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
            <th className="px-5 py-3">{t("rank")}</th>
            <th className="px-3 py-3">{t("team")}</th>
            <th className="px-3 py-3">{t("school")}</th>
            {showScores && <th className="px-5 py-3 text-right">{t("score", { scale })}</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={`${r.rank}-${r.name}`} className="border-b border-slate-50 last:border-0">
              <td className="px-5 py-3">
                <span className="inline-flex items-center gap-1.5 font-extrabold text-primary">
                  {r.rank === 1 ? <Trophy className="size-4 text-amber-500" /> : MEDAL[r.rank] && <Medal className={`size-4 ${MEDAL[r.rank]}`} />}
                  {r.rank}
                  {r.tied && <span className="rounded bg-accent-light px-1.5 py-0.5 text-[10px] font-bold uppercase text-accent">{t("tied")}</span>}
                </span>
              </td>
              <td className="px-3 py-3 font-semibold text-primary">{r.name}</td>
              <td className="px-3 py-3 text-slate-500">{r.etablissement}</td>
              {showScores && <td className="px-5 py-3 text-right font-bold text-primary">{r.score}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
