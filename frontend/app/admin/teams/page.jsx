"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations, useFormatter } from "next-intl";
import { Search, Download, ArrowRight, FileSpreadsheet, FileText, Sheet } from "lucide-react";
import RequireAuth from "@/components/auth/RequireAuth";
import AppShell from "@/components/layout/AppShell";
import StatusBadge from "@/components/ui/StatusBadge";
import TeamLogo from "@/components/team/TeamLogo";
import Spinner from "@/components/ui/Spinner";
import { ErrorAlert } from "@/components/ui/Alert";
import { btn, card } from "@/components/ui/styles";
import { api, downloadProtectedFile } from "@/lib/api";

const TABS = ["", "en_attente", "en_revision", "valide", "rejete", "brouillon"];
const EXPORTS = [
  { format: "csv", label: "CSV", Icon: Sheet },
  { format: "xlsx", label: "Excel", Icon: FileSpreadsheet },
  { format: "pdf", label: "PDF", Icon: FileText },
];

function TeamsList() {
  const t = useTranslations("adminTeams");
  const ts = useTranslations("status");
  const locale = useLocale();
  const format = useFormatter();
  const router = useRouter();
  const params = useSearchParams();

  const [status, setStatus] = useState(params.get("status") || "");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState(""); // recherche envoyée à l'API (après une courte pause)
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(null);

  // On attend 300 ms après la dernière frappe avant de lancer la recherche
  useEffect(() => {
    const id = setTimeout(() => setQuery(search), 300);
    return () => clearTimeout(id);
  }, [search]);

  const filters = new URLSearchParams({ ...(status && { status }), ...(query && { q: query }) }).toString();

  useEffect(() => {
    setError(null);
    api(`/api/admin/teams?${filters}`).then(setData).catch(setError);
  }, [filters]);

  const changeTab = (s) => {
    setStatus(s);
    router.replace(s ? `/admin/teams?status=${s}` : "/admin/teams", { scroll: false });
  };

  // F2.9 : export avec les mêmes filtres que la liste affichée
  const exportAs = async (fmt) => {
    setExporting(fmt);
    try {
      await downloadProtectedFile(
        `/api/admin/teams/export?format=${fmt}&lang=${locale}${filters ? `&${filters}` : ""}`,
        `equipes.${fmt}`
      );
    } catch (err) {
      setError(err);
    } finally {
      setExporting(null);
    }
  };

  const total = data ? Object.values(data.counts).reduce((a, b) => a + b, 0) : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* ---- En-tête avec petite barre orange ---- */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">{t("title")}</h1>
          <span className="mt-2 block h-1 w-14 rounded-full bg-accent" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 text-sm font-semibold text-accent">
            <Download className="size-4" /> {t("export")}
          </span>
          {EXPORTS.map(({ format: fmt, label, Icon }) => (
            <button key={fmt} onClick={() => exportAs(fmt)} disabled={!!exporting}
              className={`${btn.outline} hover:border-accent hover:text-accent`}>
              <Icon className="size-4" /> {exporting === fmt ? t("exporting") : label}
            </button>
          ))}
        </div>
      </div>

      {/* Onglets par statut */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((s) => {
          const count = s ? data?.counts[s] || 0 : total;
          const active = status === s;
          return (
            <button key={s || "all"} onClick={() => changeTab(s)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${
                active
                  ? "bg-primary text-white ring-2 ring-accent/60"
                  : "bg-white text-primary hover:bg-accent-light hover:text-accent"
              }`}>
              {s ? ts(s) : t("all")} <span className={active ? "text-accent" : "text-slate-400"}>({count})</span>
            </button>
          );
        })}
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-accent" />
        <input type="search" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder={t("search")} aria-label={t("search")}
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm outline-none focus:border-accent focus:ring-4 focus:ring-accent/15" />
      </div>

      <ErrorAlert error={error} />

      {!data ? (
        <Spinner />
      ) : data.teams.length === 0 ? (
        <p className={`${card} text-center text-slate-500`}>{t("empty")}</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-lg shadow-primary/5">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b-4 border-accent bg-primary text-xs uppercase tracking-wide text-white">
              <tr>
                <th className="px-4 py-3">{t("team")}</th>
                <th className="px-4 py-3">{t("chef")}</th>
                <th className="px-4 py-3 text-center">{t("members")}</th>
                <th className="px-4 py-3">{t("submittedAt")}</th>
                <th className="px-4 py-3">{t("status")}</th>
                <th className="px-4 py-3"><span className="sr-only">{t("review")}</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.teams.map((team) => (
                <tr key={team._id} className="group transition hover:bg-accent-light/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <TeamLogo logo={team.logo} name={team.name} size="size-10" />
                      <div>
                        <p className="font-semibold text-ink">{team.name}</p>
                        <p className="text-xs text-slate-500">{team.etablissement}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {team.chef && (
                      <>
                        <p>{team.chef.prenom} {team.chef.nom}</p>
                        <p className="text-xs text-slate-500">{team.chef.email}</p>
                      </>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center font-semibold text-primary">{team.membersCount}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {team.submittedAt ? format.dateTime(new Date(team.submittedAt), { dateStyle: "medium" }) : "—"}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={team.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/teams/${team._id}`}
                      className={`${btn.ghost} group-hover:text-accent`}>
                      {t("review")}
                      <ArrowRight className="size-4 transition group-hover:translate-x-1" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function AdminTeamsPage() {
  return (
    <RequireAuth roles={["admin"]}>
      {(user) => (
        <AppShell user={user}>
          <Suspense fallback={<Spinner />}>
            <TeamsList />
          </Suspense>
        </AppShell>
      )}
    </RequireAuth>
  );
}