"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Menu,
  X,
  LayoutDashboard,
  ChevronDown,
  ArrowRight,
  BookOpen,
  ShieldCheck,
  CalendarDays,
  Gavel,
  Handshake,
} from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { getToken, homeFor } from "@/lib/auth";

export default function PublicHeader() {
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);          // menu mobile
  const [dropdown, setDropdown] = useState(false);  // sous-menu "La compétition"
  const [space, setSpace] = useState(null);         // lien "Mon espace" si connecté
  const [scrolled, setScrolled] = useState(false);  // ombre après un peu de scroll
  const dropdownRef = useRef(null);

  // Le localStorage n'existe que dans le navigateur : on le lit après l'affichage
  useEffect(() => {
    const stored = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (getToken() && stored) setSpace(homeFor(JSON.parse(stored)));
  }, []);

  // Ombre + fond plus net quand on descend dans la page
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
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
    { href: "/reglement", label: t("rules"), icon: BookOpen },
    { href: "/eligibilite", label: t("eligibility"), icon: ShieldCheck },
    { href: "/calendrier", label: t("calendar"), icon: CalendarDays },
    { href: "/jury", label: t("jury"), icon: Gavel },
    { href: "/partenaires", label: t("partners"), icon: Handshake },
  ];
  const main = [
    { href: "/news", label: t("news") },
    { href: "/archives", label: t("archives") },
    { href: "/faq", label: t("faq") },
    { href: "/contact", label: t("contact") },
  ];

  const isActive = (href) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const competitionActive = competition.some((l) => isActive(l.href));

  // Lien du menu desktop : texte + petit trait animé sous le lien actif
  const navLink = (active) =>
    `group relative rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${
      active ? "text-accent" : "text-primary/80 hover:text-primary"
    }`;
  const Underline = ({ active }) => (
    <span
      className={`absolute inset-x-3.5 -bottom-0.5 h-0.5 origin-left rounded-full bg-accent transition-transform duration-300 ${
        active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100 group-hover:bg-primary/30"
      }`}
    />
  );

  return (
    <header
      className={`sticky top-0 z-30 border-b transition-all duration-300 ${
        scrolled
          ? "border-slate-200/80 bg-white/90 shadow-lg shadow-primary/5 backdrop-blur-xl"
          : "border-transparent bg-white"
      }`}
    >
      <div
        className={`mx-auto flex max-w-6xl items-center gap-4 px-4 transition-all duration-300 ${
          scrolled ? "py-2" : "py-3.5"
        }`}
      >
        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <Image
            src="/logo.png"
            alt={tc("logoAlt")}
            width={44}
            height={44}
            className="rounded-full ring-2 ring-accent/20"
          />
          <span className="text-lg font-extrabold uppercase leading-none tracking-tight text-primary">
            IA-GC <span className="text-accent">2026</span>
          </span>
        </Link>

        {/* Navigation desktop */}
        <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex">
          <Link href="/" className={navLink(isActive("/"))}>
            {t("home")}
            <Underline active={isActive("/")} />
          </Link>

          <div ref={dropdownRef} className="relative">
            <button
              type="button"
              onClick={() => setDropdown(!dropdown)}
              aria-expanded={dropdown}
              aria-haspopup="true"
              className={`${navLink(competitionActive || dropdown)} inline-flex items-center gap-1`}
            >
              {t("competition")}
              <ChevronDown
                className={`size-4 transition-transform duration-300 ${dropdown ? "rotate-180" : ""}`}
              />
              <Underline active={competitionActive || dropdown} />
            </button>

            {/* Sous-menu : toujours rendu pour pouvoir animer l'apparition */}
            <div
              className={`absolute left-1/2 top-full z-40 mt-3 w-64 -translate-x-1/2 origin-top transition-all duration-200 ${
                dropdown
                  ? "visible translate-y-0 opacity-100"
                  : "invisible -translate-y-2 opacity-0"
              }`}
            >
              {/* petite flèche */}
              <span className="absolute -top-1.5 left-1/2 size-3 -translate-x-1/2 rotate-45 rounded-sm bg-white ring-1 ring-slate-200" />
              <div className="relative flex flex-col gap-0.5 rounded-2xl bg-white p-2 shadow-2xl shadow-primary/15 ring-1 ring-slate-200">
                {competition.map((l) => {
                  const Icon = l.icon;
                  const active = isActive(l.href);
                  return (
                    <Link
                      key={l.href}
                      href={l.href}
                      className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                        active ? "bg-accent-light text-accent" : "text-primary hover:bg-surface"
                      }`}
                    >
                      <span
                        className={`flex size-8 items-center justify-center rounded-lg transition-colors ${
                          active
                            ? "bg-accent text-white"
                            : "bg-surface text-primary group-hover:bg-accent group-hover:text-white"
                        }`}
                      >
                        <Icon className="size-4" />
                      </span>
                      {l.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {main.map((l) => (
            <Link key={l.href} href={l.href} className={navLink(isActive(l.href))}>
              {l.label}
              <Underline active={isActive(l.href)} />
            </Link>
          ))}
        </nav>

        {/* Actions à droite */}
        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <LanguageSwitcher className="shadow-none ring-1 ring-slate-200" />

          <div className="hidden items-center gap-2 lg:flex">
            <span className="mx-1 h-6 w-px bg-slate-200" />
            {space ? (
              <Link
                href={space}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/20 transition hover:bg-primary-dark"
              >
                <LayoutDashboard className="size-4" /> {t("mySpace")}
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-xl px-3.5 py-2.5 text-sm font-semibold text-primary transition hover:bg-surface"
                >
                  {t("login")}
                </Link>
                <Link
                  href="/register"
                  className="group inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-accent/30 transition hover:-translate-y-0.5 hover:bg-primary hover:shadow-lg hover:shadow-primary/25"
                >
                  {t("register")}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </>
            )}
          </div>

          <button
            onClick={() => setOpen(!open)}
            className="rounded-xl p-2 text-primary transition hover:bg-surface lg:hidden"
            aria-expanded={open}
            aria-label={t("menu")}
          >
            {open ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      {/* Menu mobile : toutes les pages à plat */}
      {open && (
        <nav className="flex max-h-[80vh] flex-col gap-1 overflow-y-auto border-t border-slate-100 bg-white px-4 pb-5 pt-3 shadow-xl lg:hidden">
          <Link
            href="/"
            className={`rounded-xl px-3 py-3 font-semibold ${
              isActive("/") ? "bg-accent-light text-accent" : "text-primary hover:bg-surface"
            }`}
          >
            {t("home")}
          </Link>

          <p className="px-3 pb-1 pt-4 text-xs font-bold uppercase tracking-wider text-slate-400">
            {t("competition")}
          </p>
          {competition.map((l) => {
            const Icon = l.icon;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 font-semibold ${
                  isActive(l.href) ? "bg-accent-light text-accent" : "text-primary hover:bg-surface"
                }`}
              >
                <Icon className="size-4" />
                {l.label}
              </Link>
            );
          })}

          <hr className="my-2 border-slate-100" />

          {main.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-xl px-3 py-3 font-semibold ${
                isActive(l.href) ? "bg-accent-light text-accent" : "text-primary hover:bg-surface"
              }`}
            >
              {l.label}
            </Link>
          ))}

          {space ? (
            <Link
              href={space}
              className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-center font-semibold text-white"
            >
              <LayoutDashboard className="size-4" /> {t("mySpace")}
            </Link>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link
                href="/login"
                className="rounded-xl border border-primary/30 px-4 py-3 text-center font-semibold text-primary"
              >
                {t("login")}
              </Link>
              <Link
                href="/register"
                className="rounded-xl bg-accent px-4 py-3 text-center font-semibold text-white shadow-md shadow-accent/30"
              >
                {t("register")}
              </Link>
            </div>
          )}
        </nav>
      )}
    </header>
  );
}