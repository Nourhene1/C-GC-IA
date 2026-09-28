"use client";
import { useEffect, useState } from "react";
import { useTranslations, useFormatter } from "next-intl";
import { MILESTONES } from "@/lib/content";
import { DATE_LONG } from "@/lib/format";

const pad = (n) => String(n).padStart(2, "0");

// F1.3 : compte à rebours vers la prochaine date clé de l'édition
export default function Countdown({ dates, serverNow }) {
  const t = useTranslations("countdown");
  const format = useFormatter();
  const [now, setNow] = useState(null); // null tant que la page n'est pas chargée dans le navigateur

  useEffect(() => {
    // Écart entre l'horloge du serveur et celle du visiteur : on s'aligne sur le serveur
    const offset = new Date(serverNow).getTime() - Date.now();
    const tick = () => setNow(Date.now() + offset);
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [serverNow]);

  if (now === null) return <div className="h-40" aria-hidden />;

  // Prochaine étape pas encore atteinte
  const next = MILESTONES.find((key) => dates[key] && new Date(dates[key]).getTime() > now);

  if (!next) {
    return <p className="py-10 text-center text-lg font-bold text-primary">{t("finished")}</p>;
  }

  const diff = new Date(dates[next]).getTime() - now;
  const parts = [
    { value: Math.floor(diff / 86_400_000), label: t("days") },
    { value: Math.floor(diff / 3_600_000) % 24, label: t("hours") },
    { value: Math.floor(diff / 60_000) % 60, label: t("minutes") },
    { value: Math.floor(diff / 1000) % 60, label: t("seconds") },
  ];

  return (
    <div className="text-center">
      <p className="text-sm font-bold uppercase tracking-wide text-accent">{t(`to.${next}`)}</p>
      <div className="mt-4 flex justify-center gap-3 sm:gap-5" role="timer" aria-live="off">
        {parts.map((p) => (
          <div key={p.label} className="w-18 rounded-2xl bg-primary px-2 py-3 text-white sm:w-24 sm:py-4">
            <p className="text-3xl font-extrabold tabular-nums sm:text-4xl">{pad(p.value)}</p>
            <p className="mt-1 text-[11px] font-semibold uppercase text-white/70 sm:text-xs">{p.label}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm text-slate-500">{format.dateTime(new Date(dates[next]), DATE_LONG)}</p>
    </div>
  );
}
