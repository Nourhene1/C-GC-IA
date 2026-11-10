
import { getTranslations } from "next-intl/server";
import { UserRound } from "lucide-react";
import PageHero from "@/components/public/PageHero";
import { serverApi, publicFileUrl } from "@/lib/server-api";

export async function generateMetadata() {
  const t = await getTranslations("organization");

  return {
    title: t("title"),
  };
}

// Présentation des membres de l'organisation
export default async function OrganizationPage() {
  const t = await getTranslations("organization");

  const data = await serverApi("/api/organization");
  const members = data?.members || [];

  return (
    <>
      <PageHero
        title={t("title")}
        subtitle={t("subtitle")}
      />

      <div className="mx-auto max-w-6xl px-4 py-10">
        {members.length === 0 ? (
          <p className="rounded-2xl bg-white p-10 text-center text-slate-500">
            {t("empty")}
          </p>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {members.map((member) => (
              <li
                key={member._id}
                className="flex flex-col items-center rounded-3xl bg-white p-6 text-center shadow-lg shadow-primary/5"
              >
                {member.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element -- image servie par l'API
                  <img
                    src={publicFileUrl(member.photo)}
                    alt={`${member.firstName} ${member.lastName}`}
                    className="size-28 rounded-full object-cover ring-4 ring-accent-light"
                  />
                ) : (
                  <span className="flex size-28 items-center justify-center rounded-full bg-accent-light">
                    <UserRound className="size-12 text-accent" />
                  </span>
                )}

                <p className="mt-4 font-bold text-primary">
                  {member.firstName} {member.lastName}
                </p>

                {member.role && (
                  <p className="text-sm font-semibold text-accent">
                    {member.role}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
