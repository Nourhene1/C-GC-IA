"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Menu, X, LayoutDashboard, ChevronDown } from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { getToken, homeFor } from "@/lib/auth";

export default function PublicHeader() {
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);          // menu mobile
  const [dropdown, setDropdown] = useState(false);  // sous-menu "La compétition"
  const [space, setSpace] = useState(null);         // lien "Mon espace" si connecté
  const dropdownRef = useRef(null);

  // Le localStorage n'existe que dans le navigateur : on le lit après l'affichage
  useEffect(() => {
    const stored = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (getToken() && stored) setSpace(homeFor(JSON.parse(stored)));
  }, []);

  // Ferme les menus quand on change de page
  useEffect(() => {
    setOpen(false);
    setDropdown(false);
  }, [pathname]);

  // Ferme le sous-menu au clic en dehors ou avec Échap
  useEffect(() => {
    if (!dropdown) return;
    const onClick = (e) => !dropdownRef.current?.contains(e.target) && setDropdown(false);
    const onKey = (e) => e.key === "Escape" && setDropdown(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [dropdown]);

  // Pages du sous-menu "La compétition" (Module 3 + partenaires)
  const competition = [
    { href: "/reglement", label: t("rules") },
    { href: "/eligibilite", label: t("eligibility") },
    { href: "/calendrier", label: t("calendar") },
    { href: "/jury", label: t("jury") },
    { href: "/partenaires", label: t("partners") },
  ];
  const main = [
    { href: "/news", label: t("news") },
    { href: "/archives", label: t("archives") },
    { href: "/faq", label: t("faq") },
    { href: "/contact", label: t("contact") },
  ];

  const isActive = (href) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const competitionActive = competition.some((l) => isActive(l.href));
  const linkClass = (active) =>
    `rounded-lg px-3 py-2 text-sm font-semibold transition ${active ? "text-accent" : "text-primary hover:bg-surface"}`;

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <Image src="/logo.png" alt={tc("logoAlt")} width={44} height={44} className="rounded-full" />
          <span className="font-extrabold uppercase leading-none text-primary">
            IA-GC <span className="text-accent">2026</span>
          </span>
        </Link>

        <nav className="hidden flex-1 items-center gap-0.5 lg:flex">
          <Link href="/" className={linkClass(isActive("/"))}>{t("home")}</Link>

          <div ref={dropdownRef} className="relative">
            <button type="button" onClick={() => setDropdown(!dropdown)} aria-expanded={dropdown}
              className={`${linkClass(competitionActive)} inline-flex items-center gap-1`}>
              {t("competition")} <ChevronDown className={`size-4 transition ${dropdown ? "rotate-180" : ""}`} />
            </button>
            {dropdown && (
              <div className="absolute left-0 top-full mt-2 flex w-56 flex-col rounded-2xl bg-white p-2 shadow-xl ring-1 ring-slate-200">
                {competition.map((l) => (
                  <Link key={l.href} href={l.href}
                    className={`rounded-lg px-3 py-2 text-sm font-semibold ${isActive(l.href) ? "bg-accent-light text-accent" : "text-primary hover:bg-surface"}`}>
                    {l.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {main.map((l) => (
            <Link key={l.href} href={l.href} className={linkClass(isActive(l.href))}>{l.label}</Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <LanguageSwitcher className="shadow-none ring-1 ring-slate-200" />
          <div className="hidden items-center gap-2 lg:flex">
            {space ? (
              <Link href={space} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark">
                <LayoutDashboard className="size-4" /> {t("mySpace")}
              </Link>
            ) : (
              <>
                <Link href="/login" className="rounded-xl px-3 py-2 text-sm font-semibold text-primary hover:bg-surface">
                  {t("login")}
                </Link>
                <Link href="/register" className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white shadow-md shadow-accent/30 hover:bg-primary">
                  {t("register")}
                </Link>
              </>
            )}
          </div>
          <button onClick={() => setOpen(!open)} className="rounded-lg p-2 text-primary lg:hidden"
            aria-expanded={open} aria-label={t("menu")}>
            {open ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      {/* Menu mobile : toutes les pages à plat */}
      {open && (
        <nav className="flex max-h-[75vh] flex-col gap-1 overflow-y-auto border-t border-slate-100 px-4 pb-4 pt-2 lg:hidden">
          <Link href="/" className={`rounded-lg px-3 py-2.5 font-semibold ${isActive("/") ? "bg-accent-light text-accent" : "text-primary"}`}>
            {t("home")}
          </Link>
          <p className="px-3 pt-3 text-xs font-bold uppercase tracking-wide text-slate-400">{t("competition")}</p>
          {[...competition, ...main].map((l, i) => (
            <div key={l.href}>
              {i === competition.length && <hr className="my-2 border-slate-100" />}
              <Link href={l.href}
                className={`block rounded-lg px-3 py-2.5 font-semibold ${isActive(l.href) ? "bg-accent-light text-accent" : "text-primary"}`}>
                {l.label}
              </Link>
            </div>
          ))}
          {space ? (
            <Link href={space} className="mt-2 rounded-xl bg-primary px-4 py-3 text-center font-semibold text-white">{t("mySpace")}</Link>
          ) : (
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Link href="/login" className="rounded-xl border border-primary/30 px-4 py-3 text-center font-semibold text-primary">{t("login")}</Link>
              <Link href="/register" className="rounded-xl bg-accent px-4 py-3 text-center font-semibold text-white">{t("register")}</Link>
            </div>
          )}
        </nav>
      )}
    </header>
  );
}
