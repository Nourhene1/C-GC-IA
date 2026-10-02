"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  LogOut,
  LayoutDashboard,
  Users,
  Newspaper,
  FileText,
  CircleHelp,
  Mail,
  Handshake,
  CalendarRange,
  BookOpen,
  FileCheck,
  ClipboardCheck,
  Trophy,
} from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import NotificationBell from "@/components/common/NotificationBell";
import { NotificationProvider } from "@/context/NotificationContext";
import { logout } from "@/lib/auth";

// En-tête + zone de contenu des pages connectées
export default function AppShell({ user, children }) {
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const pathname = usePathname();
  const router = useRouter();

  // Liens selon le rôle
  const adminLinks = [
    { href: "/admin", label: t("dashboard"), Icon: LayoutDashboard },
    { href: "/admin/teams", label: t("teams"), Icon: Users },
    { href: "/admin/news", label: t("news"), Icon: Newspaper },
    { href: "/admin/content", label: t("content"), Icon: FileText },
    { href: "/admin/faq", label: t("faq"), Icon: CircleHelp },
    { href: "/admin/messages", label: t("messages"), Icon: Mail },
    { href: "/admin/sponsors", label: t("partners"), Icon: Handshake },
    { href: "/admin/editions", label: t("editions"), Icon: CalendarRange },
    { href: "/admin/subject", label: t("subject"), Icon: BookOpen },
    { href: "/admin/submissions", label: t("submission"), Icon: FileCheck },
    { href: "/admin/evaluations", label: t("evaluations"), Icon: ClipboardCheck }, // Module 6
    { href: "/admin/results", label: t("results"), Icon: Trophy },                  // Module 7
  ];

  const juryLinks = [
    { href: "/dashboard", label: t("dashboard"), Icon: LayoutDashboard },
    { href: "/jury/submissions", label: t("submission"), Icon: FileCheck },
    { href: "/jury/evaluations", label: t("evaluations"), Icon: ClipboardCheck }, // Module 6
  ];

  const teamLinks = [
    { href: "/dashboard", label: t("dashboard"), Icon: LayoutDashboard },
    ...(user.team
      ? [
        { href: "/team", label: t("myTeam"), Icon: Users },
        { href: "/team/subject", label: t("subject"), Icon: BookOpen },
        { href: "/team/submission", label: t("submission"), Icon: FileCheck },
      ]
      : []),
  ];

  const linksByRole = {
    admin: adminLinks,
    jury: juryLinks,
  };

  const links = linksByRole[user.role] ?? teamLinks;

  const isActive = (href) => {
    // Routes principales : actives uniquement sur leur page exacte
    if (
      href === "/admin" ||
      href === "/dashboard" ||
      href === "/team" ||
      href === "/jury"
    ) {
      return pathname === href;
    }

    // Sous-pages : actives sur la page et ses sous-pages
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  const initials =
    `${user.prenom?.[0] ?? ""}${user.nom?.[0] ?? ""}`.toUpperCase();

  return (
    <NotificationProvider>
      <div className="min-h-screen bg-surface">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
          {/* Niveau 1 : identité à gauche, outils et profil à droite */}
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
            <Link
              href="/"
              className="flex shrink-0 items-center gap-3"
              title={t("home")}
            >
              <Image
                src="/logo.png"
                alt={tc("logoAlt")}
                width={44}
                height={44}
                className="rounded-full"
              />

              <span className="text-lg font-extrabold uppercase leading-none text-primary">
                IA-GC <span className="text-accent">2026</span>
              </span>
            </Link>

            <div className="flex items-center gap-3">
              <LanguageSwitcher className="shadow-none ring-1 ring-slate-200" />

              <NotificationBell />

              <span
                className="hidden h-8 w-px bg-slate-200 sm:block"
                aria-hidden="true"
              />

              {/* Profil : avatar + nom + rôle */}
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                  {initials}
                </span>

                <div className="hidden text-left leading-tight md:block">
                  <p className="text-sm font-semibold text-ink">
                    {user.prenom} {user.nom}
                  </p>

                  <p className="text-xs text-slate-500">
                    {tc(`roles.${user.role}`)}
                  </p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                title={tc("logout")}
                aria-label={tc("logout")}
                className="rounded-xl p-2.5 text-primary ring-1 ring-slate-200 transition hover:bg-red-50 hover:text-red-600 hover:ring-red-200"
              >
                <LogOut className="size-5" />
              </button>
            </div>
          </div>

          {/* Niveau 2 : navigation alignée sur le contenu ; passe à la ligne s'il y a beaucoup de liens */}
          <div className="border-t border-slate-100">
            <nav
              aria-label={t("menu")}
              className="mx-auto flex max-w-6xl flex-wrap gap-1 px-4 py-2"
            >
              {links.map(({ href, label, Icon }) => {
                const active = isActive(href);

                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2 text-sm font-semibold transition ${active
                        ? "bg-primary text-white shadow-md shadow-primary/20"
                        : "text-primary hover:bg-surface"
                      }`}
                  >
                    <Icon
                      className={`size-4 ${active ? "text-white" : "text-accent"
                        }`}
                    />

                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </div>
    </NotificationProvider>
  );
}