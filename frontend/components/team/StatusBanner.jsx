"use client";
import { useTranslations, useFormatter } from "next-intl";
import { CircleCheckBig, Clock, FilePen, RotateCcw, CircleX } from "lucide-react";
import { DATE_LONG } from "@/lib/format";

const STYLES = {
  brouillon:   { box: "border-slate-200 bg-white", Icon: FilePen, icon: "text-slate-500" },
  en_attente:  { box: "border-amber-200 bg-amber-50", Icon: Clock, icon: "text-amber-600" },
  en_revision: { box: "border-blue-200 bg-blue-50", Icon: RotateCcw, icon: "text-blue-600" },
  rejete:      { box: "border-red-200 bg-red-50", Icon: CircleX, icon: "text-red-600" },
  valide:      { box: "border-green-200 bg-green-50", Icon: CircleCheckBig, icon: "text-green-600" },
};

// Bandeau qui explique où en est le dossier (F2.8)
export default function StatusBanner({ team, registrationOpen }) {
  const t = useTranslations("teamPage");
  const format = useFormatter();
  const { box, Icon, icon } = STYLES[team.status];

  let message;
  if (team.status === "brouillon") {
    message = registrationOpen
      ? t("banner.brouillon", {
          close: format.dateTime(new Date(team.edition.dates.registrationClose), DATE_LONG),
        })
      : t("banner.brouillonClosed");
  } else {
    message = t(`banner.${team.status}`);
  }

  return (
    <div className={`flex gap-4 rounded-2xl border p-5 ${box}`}>
      <Icon className={`mt-0.5 size-6 shrink-0 ${icon}`} />
      <div className="text-sm">
        <p className="font-semibold text-ink">{message}</p>
        {team.rejectionReason && ["en_revision", "rejete"].includes(team.status) && (
          <p className="mt-2 rounded-lg bg-white/70 px-3 py-2 text-ink">
            <span className="font-semibold">{t("reason")} : </span>
            {team.rejectionReason}
          </p>
        )}
      </div>
    </div>
  );
}
