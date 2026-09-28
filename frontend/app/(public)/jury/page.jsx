import { getLocale, getTranslations } from "next-intl/server";
import { UserRound } from "lucide-react";
import PageHero from "@/components/public/PageHero";
import { serverApi, publicFileUrl } from "@/lib/server-api";
import { pick } from "@/lib/content";

export async function generateMetadata() {
  const t = await getTranslations("jury");
  return { title: t("title") };
}

// F3.6 : présentation des membres du jury
export default async function JuryPage() {
  const t = await getTranslations("jury");
  const locale = await getLocale();
  const data = await serverApi("/api/content");
  const jury = data?.content?.jury || [];

  return (
    <>
      <PageHero title={t("title")} subtitle={t("subtitle")} />
      <div className="mx-auto max-w-6xl px-4 py-10">
        {jury.length === 0 ? (
          <p className="rounded-2xl bg-white p-10 text-center text-slate-500">{t("empty")}</p>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {jury.map((m) => (
              <li key={m._id} className="flex flex-col items-center rounded-3xl bg-white p-6 text-center shadow-lg shadow-primary/5">
                {m.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element -- image servie par l'API
                  <img src={publicFileUrl(m.photo)} alt={m.name}
                    className="size-28 rounded-full object-cover ring-4 ring-accent-light" />
                ) : (
                  <span className="flex size-28 items-center justify-center rounded-full bg-accent-light">
                    <UserRound className="size-12 text-accent" />
                  </span>
                )}
                <p className="mt-4 font-bold text-primary">{m.name}</p>
                {pick(m.role, locale) && <p className="text-sm font-semibold text-accent">{pick(m.role, locale)}</p>}
                {m.organization && <p className="mt-1 text-sm text-slate-500">{m.organization}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
