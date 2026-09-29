import { getTranslations } from "next-intl/server";
import PageHero from "@/components/public/PageHero";
import ContactForm from "@/components/public/ContactForm";

export async function generateMetadata() {
  const t = await getTranslations("contact");
  return { title: t("title") };
}

// F3.4 : formulaire de contact
export default async function ContactPage() {
  const t = await getTranslations("contact");

  return (
    <>
      <PageHero title={t("title")} subtitle={t("subtitle")} />

      <main className="mx-auto flex max-w-4xl justify-center px-4 py-10 sm:px-6 lg:px-8">
        <section className="w-full rounded-3xl bg-white p-6 shadow-xl shadow-primary/5 sm:p-10">
          <h2 className="mb-6 text-center text-2xl font-bold text-primary">
            {t("formTitle")}
          </h2>

          <ContactForm />
        </section>
      </main>
    </>
  );
}
