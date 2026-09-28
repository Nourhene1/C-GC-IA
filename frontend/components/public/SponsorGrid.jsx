import { useTranslations } from "next-intl";
import { publicFileUrl } from "@/lib/server-api";

const TIER_ORDER = ["platine", "or", "argent", "bronze", "partenaire"];

// F1.5 : logos des partenaires, groupés par niveau
export default function SponsorGrid({ sponsors, grouped = true }) {
  const t = useTranslations("partners");

  const Logo = ({ s }) => {
    const inner = s.logo ? (
      // eslint-disable-next-line @next/next/no-img-element -- image servie par l'API
      <img src={publicFileUrl(s.logo)} alt={s.name} className="max-h-16 max-w-full object-contain" />
    ) : (
      <span className="text-center font-bold text-primary">{s.name}</span>
    );
    const box = "flex h-28 items-center justify-center rounded-2xl bg-white p-4 shadow-md shadow-primary/5 transition hover:shadow-lg";
    return s.website ? (
      <a href={s.website} target="_blank" rel="noopener noreferrer" className={box} title={s.name}>{inner}</a>
    ) : (
      <div className={box} title={s.name}>{inner}</div>
    );
  };

  if (!grouped) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {sponsors.map((s) => <Logo key={s._id} s={s} />)}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      {TIER_ORDER.map((tier) => {
        const list = sponsors.filter((s) => s.tier === tier);
        if (list.length === 0) return null;
        return (
          <section key={tier}>
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-accent">{t(`tiers.${tier}`)}</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {list.map((s) => <Logo key={s._id} s={s} />)}
            </div>
          </section>
        );
      })}
    </div>
  );
}
