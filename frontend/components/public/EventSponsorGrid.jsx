import { getTranslations } from "next-intl/server";
import { TIERS, assetUrl } from "@/lib/eventSponsorsApi";

const LOGO_HEIGHT = {
  titre: "h-32",
  or: "h-24",
  argent: "h-20",
  bronze: "h-16",
};

export default async function EventSponsorGrid({ sponsors = [] }) {
  const t = await getTranslations("eventSponsorsPage");

  const groups = TIERS.map((tier) => ({
    value: tier.value,
    items: sponsors.filter((s) => s.tier === tier.value),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="flex flex-col gap-14">
      {groups.map((group) => (
        <section key={group.value}>
          <h2 className="mb-6 text-sm font-bold uppercase tracking-wider text-accent">
            {t(`tiers.${group.value}`)}
          </h2>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {group.items.map((s) => {
              const logo = (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={assetUrl(s.logo)}
                  alt={s.name}
                  className={`${LOGO_HEIGHT[group.value]} w-full object-contain transition group-hover:scale-105`}
                />
              );

              const cardClass =
                "group flex items-center justify-center rounded-2xl bg-white p-8 shadow-md shadow-primary/5 transition hover:-translate-y-1 hover:shadow-lg";

              return s.website ? (
                <a
                  key={s._id}
                  href={s.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={s.name}
                  className={cardClass}
                >
                  {logo}
                </a>
              ) : (
                <div key={s._id} title={s.name} className={cardClass}>
                  {logo}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}