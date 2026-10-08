import { getTranslations } from "next-intl/server";
import { Trophy, Medal } from "lucide-react";

// Position et taille visuelles de chaque rang : le 1er au centre, plus haut que les autres
const SLOTS = {
  1: { order: "md:order-2", height: "h-28 md:h-56", bar: "bg-amber-400 text-amber-950", Icon: Trophy },
  2: { order: "md:order-1", height: "h-28 md:h-44", bar: "bg-slate-300 text-slate-800", Icon: Medal },
  3: { order: "md:order-3", height: "h-28 md:h-36", bar: "bg-orange-300 text-orange-950", Icon: Medal },
};

// Podium des trois premières équipes d'une édition
export default async function EditionPodium({ winners = [] }) {
  const t = await getTranslations("archives");

  const top = [...winners]
    .filter((w) => w.rank >= 1 && w.rank <= 3)
    .sort((a, b) => a.rank - b.rank);

  if (top.length === 0) return null;

  return (
    <section>
      <h2 className="mb-8 text-center text-2xl font-extrabold text-primary sm:text-3xl">{t("podium")}</h2>

      <div className="grid items-end gap-6 md:grid-cols-3">
        {top.map((w) => {
          const { order, height, bar, Icon } = SLOTS[w.rank];
          return (
            <div key={w.rank} className={`${order} flex flex-col items-center text-center`}>
              <Icon className="mb-3 size-8 text-accent" />
              <p className="text-lg font-extrabold text-primary">{w.teamName}</p>
              {w.etablissement && <p className="text-sm text-slate-500">{w.etablissement}</p>}

              <div
                className={`mt-4 flex w-full items-start justify-center rounded-t-2xl pt-4 text-4xl font-black shadow-lg ${bar} ${height}`}
              >
                {w.rank}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}