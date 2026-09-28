import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function PublicFooter() {
  const t = useTranslations("footer");
  const tn = useTranslations("nav");
  const tc = useTranslations("common");

  return (
    <footer className="mt-20 bg-primary-dark text-white/80">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-3">
        <div className="flex items-start gap-3">
          <Image src="/logo.png" alt={tc("logoAlt")} width={56} height={56} className="rounded-full bg-white" />
          <div>
            <p className="font-extrabold uppercase text-white">
              {tc("competition")} IA-GC <span className="text-accent">2026</span>
            </p>
            <p className="mt-1 text-sm">{tc("tagline")}</p>
          </div>
        </div>

        <nav className="flex flex-col gap-2 text-sm">
          <p className="mb-1 font-bold uppercase tracking-wide text-white">{t("navigation")}</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            <Link href="/reglement" className="hover:text-accent">{tn("rules")}</Link>
            <Link href="/news" className="hover:text-accent">{tn("news")}</Link>
            <Link href="/calendrier" className="hover:text-accent">{tn("calendar")}</Link>
            <Link href="/faq" className="hover:text-accent">{tn("faq")}</Link>
            <Link href="/eligibilite" className="hover:text-accent">{tn("eligibility")}</Link>
            <Link href="/contact" className="hover:text-accent">{tn("contact")}</Link>
            <Link href="/jury" className="hover:text-accent">{tn("jury")}</Link>
            <Link href="/archives" className="hover:text-accent">{tn("archives")}</Link>
            <Link href="/partenaires" className="hover:text-accent">{tn("partners")}</Link>
            <Link href="/register" className="hover:text-accent">{tn("register")}</Link>
          </div>
        </nav>

        <div className="text-sm">
          <p className="mb-1 font-bold uppercase tracking-wide text-white">{t("organizer")}</p>
          <p>ISET Sfax</p>
          <p className="mt-1">{t("organizerText")}</p>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/60">
        © 2026 {tc("competition")} IA-GC — ISET Sfax
      </div>
    </footer>
  );
}
