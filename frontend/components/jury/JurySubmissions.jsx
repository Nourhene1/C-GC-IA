"use client";
import { useEffect, useState } from "react";
import { ClipboardList, ExternalLink, Lock, EyeOff } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import Spinner from "@/components/ui/Spinner";
import { ErrorAlert } from "@/components/ui/Alert";
import { btn, card, sectionTitle } from "@/components/ui/styles";
import { getJurySubmissions, downloadJuryVersion, formatSize } from "@/lib/submission";
import DownloadButton from "@/components/submission/DownloadButton";

export default function JurySubmissions() {
  const t = useTranslations("submission");
  const format = useFormatter();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getJurySubmissions().then(setData).catch(setError);
  }, []);

  // Dépôts encore ouverts : situation normale, pas une erreur
  if (error?.code === "SUBMISSIONS_STILL_OPEN") {
    return (
      <div className={`${card} text-center`}>
        <Lock className="mx-auto mb-4 size-10 text-primary/40" />
        <h2 className="text-lg font-bold text-primary">{t("jury.notYetTitle")}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">{t("jury.notYetDescription")}</p>
        {error.data?.closesAt && (
          <p className="mt-4 text-sm font-semibold text-primary">
            {t("jury.closesAt", {
              date: format.dateTime(new Date(error.data.closesAt), { dateStyle: "long", timeStyle: "short" }),
            })}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-primary">
          <ClipboardList className="size-6 text-accent" /> {t("jury.title")}
        </h1>
        <p className="mt-1 text-sm text-slate-500">{t("jury.description")}</p>
      </div>

      <ErrorAlert error={error} />

      {!data && !error && <Spinner />}

      {data?.anonymized && (
        <p className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-600">
          <EyeOff className="size-4 shrink-0" /> {t("jury.anonymized")}
        </p>
      )}

      {data && data.submissions.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 px-6 py-8 text-center text-sm text-slate-500">
          {t("jury.empty")}
        </div>
      )}

      {data?.submissions.map((s) => (
        <section key={s.id} className={card}>
          <h2 className={sectionTitle}>{s.label}</h2>
          <ul className="mt-4 flex flex-col gap-3">
            {s.items.map(({ kind, version }) => (
              <li key={kind} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-primary">{t(`kinds.${kind}`)}</p>
                  {version ? (
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {version.name ?? version.url}
                      {version.size != null && ` · ${formatSize(version.size)}`}
                      {version.late && ` · ${t("current.late")}`}
                    </p>
                  ) : (
                    <p className="mt-0.5 text-xs text-slate-400">{t("current.none")}</p>
                  )}
                </div>
                {version?.url && (
                  <a href={version.url} target="_blank" rel="noopener noreferrer" className={btn.ghost}>
                    <ExternalLink className="size-4" /> {t("actions.open")}
                  </a>
                )}
                {version && !version.url && (
                  <DownloadButton
                    fetcher={() => downloadJuryVersion(s.id, version.id)}
                    filename={version.name ?? "file"}
                  />
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}