import { useTranslations } from "next-intl";
import { publicFileUrl } from "@/lib/server-api";

const TIER_ORDER = ["platine", "or", "argent", "bronze", "partenaire"];

// Couleur du badge selon le niveau
const TIER_STYLE = {
  platine:    "bg-slate-100 text-slate-700",
  or:         "bg-yellow-50 text-yellow-700",
  argent:     "bg-gray-100 text-gray-600",
  bronze:     "bg-orange-50 text-orange-700",
  partenaire: "bg-accent-light text-accent",
};

// Carte d'un sponsor : logo cliquable (lien), nom, niveau
function SponsorCard({ s, tierLabel }) {
  const logo = s.logo ? (
    // eslint-disable-next-line @next/next/no-img-element -- image servie par l'API
    <img src={publicFileUrl(s.logo)} alt={s.name} className="max-h-20 max-w-full object-contain" />
  ) : (
    <span className="text-center font-bold text-primary">{s.name}</span>
  );

  const logoBox = "flex h-28 w-full items-center justify-center";

  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl bg-white p-5 text-center shadow-md shadow-primary/5 transition hover:shadow-lg">
      {s.website ? (
        <a href={s.website} target="_blank" rel="noopener noreferrer" className={logoBox} title={s.name}>
          {logo}
        </a>
      ) : (
        <div className={logoBox}>{logo}</div>
      )}

      <h3 className="text-base font-bold text-primary">{s.name}</h3>

      <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${TIER_STYLE[s.tier] || TIER_STYLE.partenaire}`}>
        {tierLabel}
      </span>
    </div>
  );
}

// F1.5 : sponsors dans une seule grille, triés par niveau (plus de sections par catégorie)
export default function SponsorGrid({ sponsors }) {
  const t = useTranslations("partners");

  const sorted = [...sponsors].sort(
    (a, b) => TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier)
  );

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {sorted.map((s) => (
        <SponsorCard key={s._id} s={s} tierLabel={t(`tiers.${s.tier}`)} />
      ))}
    </div>
  );
}