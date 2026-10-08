import { getLocale, getTranslations } from "next-intl/server";
import { Quote } from "lucide-react";
import { pick } from "@/lib/content";

// Témoignages des anciens participants
export default async function EditionTestimonials({ testimonials = [] }) {
  if (testimonials.length === 0) return null;
  const t = await getTranslations("archives");
  const locale = await getLocale();

  return (
    <section>
      <h2 className="mb-8 text-center text-2xl font-extrabold text-primary sm:text-3xl">
        {t("testimonials")}
      </h2>

      <div className="grid gap-5 md:grid-cols-2">
        {testimonials.map((item, i) => {
          const role = pick(item.role, locale);
          return (
            <figure key={i} className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-md shadow-primary/5">
              <Quote className="size-7 text-accent" />
              <blockquote className="flex-1 leading-relaxed text-ink">
                {pick(item.quote, locale)}
              </blockquote>
              <figcaption>
                <p className="font-bold text-primary">{item.name}</p>
                {role && <p className="text-sm text-slate-500">{role}</p>}
              </figcaption>
            </figure>
          );
        })}
      </div>
    </section>
  );
}