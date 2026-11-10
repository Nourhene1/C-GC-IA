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

// F3.4 : formulaire de contact + référents ajoutés par l'admin
export default async function ContactPage() {
  const t = await getTranslations("contact");
  const locale = await getLocale();

  const data = await serverApi("/api/content");
  const contacts = data?.content?.contacts || [];

  return (
    <>
      <PageHero title={t("title")} subtitle={t("subtitle")} />

      <main
        className={`mx-auto px-4 py-10 sm:px-6 lg:px-8 ${
          contacts.length > 0 ? "max-w-6xl" : "max-w-4xl"
        }`}
      >
        <div
          className={`grid gap-8 ${
            contacts.length > 0 ? "lg:grid-cols-[2fr_1fr] lg:items-start" : ""
          }`}
        >
          {/* Formulaire */}
          <section className="w-full rounded-3xl bg-white p-6 shadow-xl shadow-primary/5 sm:p-10">
            <h2 className="mb-6 text-center text-2xl font-bold text-primary">
              {t("formTitle")}
            </h2>
            <ContactForm />
          </section>

          {/* Référents */}
          {contacts.length > 0 && (
            <aside className="flex flex-col gap-4">
              <h2 className="text-2xl font-bold text-primary">{t("referents")}</h2>

              <ul className="flex flex-col gap-4">
                {contacts.map((c, i) => {
                  const role = pick(c.role, locale);
                  return (
                    <li
                      key={c._id || i}
                      className="flex items-start gap-4 rounded-2xl bg-white p-5 shadow-md shadow-primary/5"
                    >
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent-light">
                        <UserRound className="size-5 text-accent" />
                      </span>

                      <div className="min-w-0">
                        <p className="font-bold text-primary">{c.name}</p>
                        {role && <p className="text-sm text-slate-500">{role}</p>}

                        {c.email && (
                          <a
                            href={`mailto:${c.email}`}
                            className="mt-2 flex items-center gap-2 break-all text-sm text-slate-600 hover:text-accent"
                          >
                            <Mail className="size-4 shrink-0 text-accent" />
                            {c.email}
                          </a>
                        )}

                        {c.phone && (
                          <a
                            href={`tel:${c.phone.replace(/\s/g, "")}`}
                            className="mt-1 flex items-center gap-2 text-sm text-slate-600 hover:text-accent"
                          >
                            <Phone className="size-4 shrink-0 text-accent" />
                            {c.phone}
                          </a>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </aside>
          )}
        </div>
      </main>
    </>
  );
}