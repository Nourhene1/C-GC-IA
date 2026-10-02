import { useTranslations } from "next-intl";
import { Trophy, Users } from "lucide-react";

// Hauteur et couleur de chaque marche du podium
const STEP = {
  1: { h: "h-40 sm:h-48", bg: "bg-accent", ring: "ring-amber-400" },
  2: { h: "h-28 sm:h-36", bg: "bg-primary", ring: "ring-slate-300" },
  3: { h: "h-20 sm:h-28", bg: "bg-primary/80", ring: "ring-orange-300" },
};

function Logo({ src, name, size }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element -- image servie par l'API
    <img src={src} alt={name} className={`${size} rounded-full bg-white object-cover`} />
  ) : (
    <span className={`${size} flex items-center justify-center rounded-full bg-accent-light`}>
      <Users className="size-1/2 text-accent" />
    </span>
  );
}

// F7.5 : podium des équipes lauréates (le 1er au centre, 2e à gauche, 3e à droite)
// fileUrl : transforme le chemin du logo en adresse complète
export default function ResultsPodium({ rows, podiumSize = 3, showScores, scale, fileUrl }) {
  const t = useTranslations("results");
  const winners = rows.filter((r) => r.rank <= podiumSize);
  const top3 = winners.filter((r) => r.rank <= 3);
  const others = winners.filter((r) => r.rank > 3);
  // Ordre d'affichage : 2e, 1er, 3e (les ex æquo restent ensemble sur leur marche)
  const order = [2, 1, 3].flatMap((rank) => top3.filter((r) => r.rank === rank));

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-end justify-center gap-3 sm:gap-6">
        {order.map((r) => {
          const s = STEP[r.rank];
          return (
            <div key={`${r.rank}-${r.name}`} className="flex w-28 flex-col items-center text-center sm:w-48">
              {r.rank === 1 && <Trophy className="mb-2 size-9 text-amber-500" />}
              <div className={`rounded-full ring-4 ${s.ring}`}>
                <Logo src={fileUrl(r.logo)} name={r.name} size={r.rank === 1 ? "size-20 sm:size-24" : "size-16 sm:size-20"} />
              </div>
              <p className="mt-3 line-clamp-2 text-sm font-extrabold text-primary sm:text-base">{r.name}</p>
              <p className="line-clamp-1 text-xs text-slate-500">{r.etablissement}</p>
              {showScores && <p className="mt-1 text-sm font-bold text-accent">{r.score} / {scale}</p>}
              <div className={`mt-3 flex w-full items-start justify-center rounded-t-2xl pt-3 text-3xl font-black text-white ${s.h} ${s.bg}`}>
                {r.rank}
              </div>
            </div>
          );
        })}
      </div>

      {others.length > 0 && (
        <ol className="mx-auto grid w-full max-w-3xl gap-3 sm:grid-cols-2">
          {others.map((r) => (
            <li key={`${r.rank}-${r.name}`} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-md shadow-primary/5">
              <span className="text-xl font-black text-accent">{r.rank}</span>
              <Logo src={fileUrl(r.logo)} name={r.name} size="size-10" />
              <div className="min-w-0">
                <p className="truncate font-bold text-primary">{r.name}</p>
                <p className="truncate text-xs text-slate-500">{r.etablissement}{showScores && ` · ${r.score} / ${scale}`}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
      {winners.some((r) => r.tied) && <p className="text-center text-xs text-slate-500">{t("tiedHint")}</p>}
    </div>
  );
}
