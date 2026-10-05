"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Users, Plus, ArrowRight, Gavel } from "lucide-react";
import RequireAuth from "@/components/auth/RequireAuth";
import AppShell from "@/components/layout/AppShell";
import StatusBadge from "@/components/ui/StatusBadge";
import TeamLogo from "@/components/team/TeamLogo";
import StatusBanner from "@/components/team/StatusBanner";
import Spinner from "@/components/ui/Spinner";
import LatestNewsWidget from "@/components/public/LatestNewsWidget";
import MyResultsCard from "@/components/results/MyResultsCard";
import { btn, card } from "@/components/ui/styles";
import { api } from "@/lib/api";

function TeamCard({ user }) {
  const t = useTranslations("dashboard");
  const [data, setData] = useState(undefined); // undefined = chargement

  useEffect(() => {
    api("/api/teams/me").then(setData).catch(() => setData({ team: null }));
  }, []);

  if (data === undefined) return <Spinner />;

  // Chef qui n'a pas encore rempli le formulaire d'équipe
  if (!data.team) {
    return (
      <div className="flex flex-col items-start gap-4 rounded-2xl border-2 border-dashed border-accent/40 bg-white p-8">
        <div className="rounded-full bg-accent-light p-3">
          <Users className="size-7 text-accent" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-primary">{t("noTeamTitle")}</h2>
          <p className="mt-1 text-slate-600">{t("noTeamText")}</p>
        </div>
        {user.role === "chef" && (
          <Link href="/team/new" className={btn.primary}>
            <Plus className="size-4" /> {t("createTeam")}
          </Link>
        )}
      </div>
    );
  }

  const { team, checklist, registrationOpen } = data;
  const done = checklist.filter((c) => c.ok).length;

  return (
    <div className="flex flex-col gap-4">
      <StatusBanner team={team} registrationOpen={registrationOpen} />
      <div className={card}>
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{t("myTeam")}</p>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <TeamLogo logo={team.logo} name={team.name} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-extrabold text-primary">{team.name}</h2>
              <StatusBadge status={team.status} />
            </div>
            <p className="mt-1 text-slate-600">{team.etablissement} · {team.filiere}</p>
            <p className="mt-1 text-sm text-slate-500">{t("members", { count: team.members.length })}</p>
          </div>
        </div>

        {/* Barre de progression du dossier */}
        <div className="mt-6">
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${(done / checklist.length) * 100}%` }} />
          </div>
          <p className="mt-2 text-xs text-slate-500">{t("progress", { done, total: checklist.length })}</p>
        </div>

        <Link href="/team" className={`${btn.primary} mt-6`}>
          {user.role === "chef" ? t("manageTeam") : t("viewTeam")} <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const tc = useTranslations("common");
  const t = useTranslations("dashboard");

  return (
    <RequireAuth roles={["chef", "membre", "jury"]}>
      {(user) => (
        <AppShell user={user}>
          <div className="mx-auto max-w-3xl">
            <h1 className="text-2xl font-bold text-primary">{tc("hello", { name: user.prenom })} 👋</h1>
            <p className="mt-1 mb-6 text-sm text-slate-600">
              {tc("role")} : <span className="font-semibold text-accent">{tc(`roles.${user.role}`)}</span>
            </p>

            {user.role === "jury" ? (
              <div className={`${card} flex items-start gap-4`}>
                <Gavel className="size-8 shrink-0 text-accent" />
                <div>
                  <h2 className="text-xl font-bold text-primary">{t("juryTitle")}</h2>
                  <p className="mt-1 text-slate-600">{t("juryText")}</p>
                  <Link href="/jury/evaluations" className={`${btn.primary} mt-4`}>
                    {t("juryEvaluations")} <ArrowRight className="size-4" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                <MyResultsCard />
                <TeamCard user={user} />
              </div>
            )}

            <div className="mt-6">
              <LatestNewsWidget />
            </div>
          </div>
        </AppShell>
      )}
    </RequireAuth>
  );
}
