import { getTranslations } from "next-intl/server";
import { TIERS, assetUrl } from "@/lib/eventSponsorsApi";

const LOGO_HEIGHT = {
  titre: "h-32",
  diamond: "h-28",
  platine: "h-24",
  or: "h-24",
  argent: "h-20",
  bronze: "h-16",
};

const TIER_STYLE = {
  titre: "bg-accent-light text-accent",
  diamond: "bg-sky-50 text-sky-700",
  platine: "bg-slate-100 text-slate-700",
  or: "bg-yellow-50 text-yellow-700",
  argent: "bg-gray-100 text-gray-600",
  bronze: "bg-orange-50 text-orange-700",
};

export default async function EventSponsorGrid({ sponsors = [] }) {
  const t = await getTranslations("eventSponsorsPage");

  // Tri par catégorie, dans l'ordre de TIERS (plus de sections séparées)
  const order = TIERS.map((tier) => tier.value);
  const sorted = [...sponsors].sort(
    (a, b) => order.indexOf(a.tier) - order.indexOf(b.tier)
  );

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {sorted.map((s) => {
        const logo = s.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={assetUrl(s.logo)}
            alt={s.name}
            className={`${LOGO_HEIGHT[s.tier] || "h-20"} w-full object-contain transition group-hover:scale-105`}
          />
        ) : (
          <span className="text-center text-lg font-bold text-primary">{s.name}</span>
        );

        const logoBox = "group flex h-36 w-full items-center justify-center";

        return (
          <div
            key={s._id}
            className="flex h-full flex-col items-center gap-3 rounded-2xl bg-white p-6 text-center shadow-md shadow-primary/5 transition hover:-translate-y-1 hover:shadow-lg"
          >
            {/* Logo cliquable : ouvre le lien du sponsor */}
            {s.website ? (
              <a
                href={s.website}
                target="_blank"
                rel="noopener noreferrer"
                title={s.name}
                className={logoBox}
              >
                {logo}
              </a>
            ) : (
              <div title={s.name} className={logoBox}>
                {logo}
              </div>
            )}

            <h3 className="text-base font-bold text-primary">{s.name}</h3>

            {s.tier && (
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${TIER_STYLE[s.tier] || "bg-slate-100 text-slate-600"}`}
              >
                {t(`tiers.${s.tier}`)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}