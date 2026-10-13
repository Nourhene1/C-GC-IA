"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { ClipboardCheck, ListChecks, Gavel, ClipboardList, Trophy } from "lucide-react";

const LINKS = [
  { href: "/admin/evaluations", key: "tracking", Icon: ListChecks, exact: true },
  { href: "/admin/evaluations/grille-jury", key: "gridFinal", Icon: Gavel },
  { href: "/admin/evaluations/grille-pre", key: "gridPre", Icon: ClipboardList },
];

// Barre d'onglets : chaque onglet est une page à part
export default function EvaluationsNav() {
  const t = useTranslations("evaluation.admin");
  const pathname = usePathname();

  return (
    <div className="flex gap-2 overflow-x-auto pb-1" role="tablist">
      {LINKS.map(({ href, key, Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link key={key} href={href} role="tab" aria-selected={active}
            className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${
              active
                ? "bg-primary text-white ring-2 ring-accent/60"
                : "bg-white text-primary hover:bg-accent-light hover:text-accent"
            }`}>
            <Icon className={`size-4 ${active ? "text-accent" : ""}`} />
            {t(`mainTabs.${key}`)}
          </Link>
        );
      })}
    </div>
  );
}