import { getTranslations } from "next-intl/server";
import EventSponsorGrid from "@/components/public/EventSponsorGrid";
import { fetchPublicEventSponsors } from "@/lib/eventSponsorsApi";

export async function generateMetadata() {
  const t = await getTranslations("eventSponsorsPage");
  return { title: t("title") };
}

export default async function SponsorsPage() {
  const t = await getTranslations("eventSponsorsPage");
  const sponsors = await fetchPublicEventSponsors().catch(() => []);

  return (
    <>
      {/* Bandeau (proche de la page partenaires) */}
      <section className="relative overflow-hidden bg-primary text-white">
        <span
          aria-hidden
          className="absolute right-0 top-4 h-2 w-72 origin-top-right rotate-[-12deg] bg-accent sm:w-[32rem]"
        />
        <span
          aria-hidden
          className="absolute right-0 top-14 h-1 w-56 origin-top-right rotate-[-12deg] bg-white/25 sm:w-[26rem]"
        />

        <div className="relative mx-auto max-w-6xl px-6 py-14 md:py-16">
          <h1 className="text-4xl font-black sm:text-5xl">{t("title")}</h1>
          <p className="mt-3 max-w-2xl text-lg text-white/80">{t("subtitle")}</p>
        </div>
      </section>

      {/* Contenu */}
      <main className="mx-auto max-w-6xl px-6 py-16">
        {sponsors.length === 0 ? (
          <p className="text-center text-slate-500">{t("empty")}</p>
        ) : (
          <EventSponsorGrid sponsors={sponsors} />
        )}
      </main>
    </>
  );
}