import { getTranslations } from "next-intl/server";
import PageHero from "@/components/public/PageHero";
import SponsorGrid from "@/components/public/SponsorGrid";
import { serverApi } from "@/lib/server-api";

// F1.5 : partenaires / sponsors de l'édition en cours
export default async function PartnersPage() {
  const t = await getTranslations("partners");
  const data = await serverApi("/api/sponsors");
  const sponsors = data?.sponsors || [];

  return (
    <>
      <PageHero title={t("title")} subtitle={t("subtitle")} />
      <div className="mx-auto max-w-6xl px-4 py-10">
        {sponsors.length === 0 ? (
          <p className="rounded-2xl bg-white p-10 text-center text-slate-500">{t("empty")}</p>
        ) : (
          <SponsorGrid sponsors={sponsors} />
        )}
      </div>
    </>
  );
}
