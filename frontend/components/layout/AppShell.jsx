"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { LogOut } from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { logout } from "@/lib/auth";

// En-tête + zone de contenu des pages connectées
export default function AppShell({ user, children }) {
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const pathname = usePathname();
  const router = useRouter();

  const links =
    user.role === "admin"
      ? [
          { href: "/admin", label: t("dashboard") },
          { href: "/admin/teams", label: t("teams") },
          { href: "/admin/news", label: t("news") },
          { href: "/admin/content", label: t("content") },
          { href: "/admin/faq", label: t("faq") },
          { href: "/admin/messages", label: t("messages") },
          { href: "/admin/sponsors", label: t("partners") },
          { href: "/admin/editions", label: t("editions") },
        ]
      : [
          { href: "/dashboard", label: t("dashboard") },
          ...(user.team ? [{ href: "/team", label: t("myTeam") }] : []),
        ];

  // "/admin/teams/123" active le lien "/admin/teams", mais pas "/admin"
  const isActive = (href) =>
    pathname === href || (href !== "/admin" && href !== "/dashboard" && pathname.startsWith(href));

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <Link href="/" className="flex items-center gap-2" title={t("home")}>
            <Image src="/logo.png" alt={tc("logoAlt")} width={40} height={40} className="rounded-full" />
            <span className="font-extrabold uppercase leading-none text-primary">
              IA-GC <span className="text-accent">2026</span>
            </span>
          </Link>

          <nav aria-label={t("menu")}
            className={`order-last flex w-full gap-1 overflow-x-auto ${links.length > 4 ? "" : "sm:order-none sm:w-auto"}`}>
            {links.map((l) => (
              <Link key={l.href} href={l.href}
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  isActive(l.href) ? "bg-primary text-white" : "text-primary hover:bg-surface"
                }`}>
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <LanguageSwitcher className="shadow-none ring-1 ring-slate-200" />
            <div className="hidden text-right text-xs leading-tight md:block">
              <p className="font-semibold text-ink">{user.prenom} {user.nom}</p>
              <p className="text-slate-500">{tc(`roles.${user.role}`)}</p>
            </div>
            <button onClick={handleLogout} title={tc("logout")} aria-label={tc("logout")}
              className="rounded-lg p-2 text-primary transition hover:bg-red-50 hover:text-red-600">
              <LogOut className="size-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
