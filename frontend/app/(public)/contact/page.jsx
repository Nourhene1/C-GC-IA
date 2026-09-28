import { getLocale, getTranslations } from "next-intl/server";
import { Mail, Phone, UserRound } from "lucide-react";
import PageHero from "@/components/public/PageHero";
import ContactForm from "@/components/public/ContactForm";
import { serverApi } from "@/lib/server-api";
import { pick } from "@/lib/content";

export async function generateMetadata() {
  const t = await getTranslations("contact");
  return { title: t("title") };
}

// F3.4 : formulaire de contact + coordonnées des référents
export default async function ContactPage() {
  const t = await getTranslations("contact");
  const locale = await getLocale();
  const data = await serverApi("/api/content");
  const contacts = data?.content?.contacts || [];

  return (
    <>
      <PageHero title={t("title")} subtitle={t("subtitle")} />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1fr_340px]">
        <section className="relative min-w-0 rounded-3xl bg-white p-6 shadow-lg shadow-primary/5 sm:p-8">
          <h2 className="mb-6 text-xl font-bold text-primary">{t("formTitle")}</h2>
          <ContactForm />
        </section>

        {contacts.length > 0 && (
          <aside className="flex flex-col gap-4">
            <h2 className="text-sm font-bold uppercase tracking-wide text-accent">{t("referents")}</h2>
            {contacts.map((c) => (
              <div key={c._id} className="rounded-2xl bg-white p-5 shadow-md shadow-primary/5">
                <p className="flex items-center gap-2 font-bold text-primary"><UserRound className="size-4 text-accent" /> {c.name}</p>
                {pick(c.role, locale) && <p className="text-sm text-slate-500">{pick(c.role, locale)}</p>}
                {c.email && (
                  <a href={`mailto:${c.email}`} className="mt-3 flex items-center gap-2 break-all text-sm text-ink hover:text-accent">
                    <Mail className="size-4 shrink-0 text-accent" /> {c.email}
                  </a>
                )}
                {c.phone && (
                  <a href={`tel:${c.phone.replace(/\s/g, "")}`} className="mt-1 flex items-center gap-2 text-sm text-ink hover:text-accent">
                    <Phone className="size-4 shrink-0 text-accent" /> {c.phone}
                  </a>
                )}
              </div>
            ))}
          </aside>
        )}
      </div>
    </>
  );
}
