"use client";
import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Search, ChevronDown } from "lucide-react";
import RichText from "./RichText";
import { pick } from "@/lib/content";

// Enlève les accents et met en minuscules, pour une recherche tolérante
const normalize = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// F3.3 : FAQ avec recherche et questions dépliables
export default function FaqList({ faqs }) {
  const t = useTranslations("faq");
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(null);

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return faqs;
    return faqs.filter((f) =>
      normalize(`${pick(f.question, locale)} ${pick(f.answer, locale)}`).includes(q)
    );
  }, [faqs, query, locale]);

  // Regroupe par catégorie, dans l'ordre reçu de l'API
  const groups = filtered.reduce((acc, f) => {
    (acc[f.category] ||= []).push(f);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-8">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder={t("search")} aria-label={t("search")}
          className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-12 pr-4 outline-none shadow-sm focus:border-accent focus:ring-4 focus:ring-accent/15" />
      </div>

      {filtered.length === 0 && (
        <p className="rounded-2xl bg-white p-8 text-center text-slate-500">
          {faqs.length === 0 ? t("empty") : t("noResult")}
        </p>
      )}

      {Object.entries(groups).map(([category, items]) => (
        <section key={category}>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-accent">{t(`categories.${category}`)}</h2>
          <div className="flex flex-col gap-2">
            {items.map((f) => {
              const isOpen = open === f._id || query.trim() !== ""; // tout déplier pendant une recherche
              return (
                <div key={f._id} className="overflow-hidden rounded-2xl bg-white shadow-md shadow-primary/5">
                  <button type="button" onClick={() => setOpen(open === f._id ? null : f._id)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center gap-4 px-5 py-4 text-left font-semibold text-primary hover:bg-surface">
                    <span className="flex-1">{pick(f.question, locale)}</span>
                    <ChevronDown className={`size-5 shrink-0 text-accent transition ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  {isOpen && (
                    <div className="border-t border-slate-100 px-5 py-4 text-sm">
                      <RichText text={pick(f.answer, locale)} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
