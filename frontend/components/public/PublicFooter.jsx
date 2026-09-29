import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight, ChevronRight, MapPin, Mail, HardHat, BrainCircuit } from "lucide-react";

export default function PublicFooter() {
  const t = useTranslations("footer");
  const tn = useTranslations("nav");
  const tc = useTranslations("common");

  const links = [
    { href: "/reglement", label: tn("rules") },
    { href: "/eligibilite", label: tn("eligibility") },
    { href: "/calendrier", label: tn("calendar") },
    { href: "/jury", label: tn("jury") },
    { href: "/partenaires", label: tn("partners") },
    { href: "/news", label: tn("news") },
    { href: "/archives", label: tn("archives") },
    { href: "/faq", label: tn("faq") },
    { href: "/contact", label: tn("contact") },
    { href: "/register", label: tn("register") },
  ];

  return (
    <footer className="relative mt-24 overflow-hidden bg-primary-dark text-white/75">
      {/* filet dégradé en haut */}
      <div className="h-1.5 bg-linear-to-r from-accent via-primary to-accent" />

      {/* décor discret */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-20 size-80 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute -right-24 bottom-0 size-96 rounded-full bg-primary/40 blur-3xl" />
        <HardHat className="absolute right-[6%] top-24 size-28 text-white/5" />
        <BrainCircuit className="absolute bottom-16 right-[22%] size-24 text-white/5" />
        <span className="absolute -right-10 top-10 h-1.5 w-64 -rotate-12 bg-accent/70" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4">
        {/* bandeau d'appel à l'action */}
        <div className="-mt-0 flex flex-col items-start justify-between gap-5 border-b border-white/10 py-10 sm:flex-row sm:items-center">
          <div>
            <p className="text-2xl font-extrabold uppercase text-white sm:text-3xl">
              {tc("competition")} IA-GC <span className="text-accent">2026</span>
            </p>
            <p className="mt-1 text-white/70">{tc("tagline")}</p>
          </div>
          <Link href="/register"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-accent px-7 py-3.5 font-semibold text-white shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:bg-white hover:text-primary">
            {tn("register")} <ArrowRight className="size-5" />
          </Link>
        </div>

        <div className="grid gap-10 py-12 md:grid-cols-12">
          {/* marque */}
          <div className="md:col-span-4">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt={tc("logoAlt")} width={64} height={64}
                className="rounded-full bg-white p-0.5 shadow-lg shadow-black/30 ring-4 ring-white/10" />
              <p className="font-extrabold uppercase leading-tight text-white">
                ISET Sfax
                <span className="block text-accent">IA &amp; Génie Civil</span>
              </p>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed">{t("organizerText")}</p>
          </div>

          {/* navigation */}
          <nav className="md:col-span-5">
            <p className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-white">
              <span className="h-1 w-6 rounded-full bg-accent" /> {t("navigation")}
            </p>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
              {links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="group inline-flex items-center gap-1 transition hover:text-white">
                    <ChevronRight className="size-4 text-accent transition group-hover:translate-x-1" />
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* organisateur */}
          <div className="md:col-span-3">
            <p className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-white">
              <span className="h-1 w-6 rounded-full bg-accent" /> {t("organizer")}
            </p>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-full bg-white/10 text-accent"><MapPin className="size-4" /></span>
                ISET Sfax
              </li>
              <li>
                <Link href="/contact" className="flex items-center gap-3 transition hover:text-white">
                  <span className="flex size-9 items-center justify-center rounded-full bg-white/10 text-accent"><Mail className="size-4" /></span>
                  {tn("contact")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 py-5 text-center text-xs text-white/50">
          © 2026 {tc("competition")} IA-GC — ISET Sfax
        </div>
      </div>
    </footer>
  );
}