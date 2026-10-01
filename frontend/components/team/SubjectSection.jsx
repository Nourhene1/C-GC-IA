"use client";

import { useEffect, useState } from "react";
import { Clock, Download, FileText, Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import useSubject from "@/lib/hooks/useSubject";
import { downloadSubjectZip } from "@/lib/subject";

import DocumentsList from "./DocumentsList";
import AddendaList from "./AddendaList";

import Spinner from "@/components/ui/Spinner";
import { Alert } from "@/components/ui/Alert";

import { btn, card, sectionTitle } from "@/components/ui/styles";

// setTimeout ne supporte pas les délais > ~24,8 jours
const MAX_TIMEOUT = 2_147_483_647;

export default function SubjectSection() {
  const t = useTranslations("subject");
  const locale = useLocale();

  const { subject, loading, error, notOpen, refetch } = useSubject();

  const [downloading, setDownloading] = useState(false);

  // Quand l'heure d'ouverture est connue, recharge le sujet à ce moment précis
  const opensAt = notOpen?.opensAt;
  useEffect(() => {
    if (!opensAt) return;

    const delay = new Date(opensAt).getTime() - Date.now();
    if (Number.isNaN(delay)) return;

    // +1 s de marge pour que le serveur considère la session comme ouverte
    const timer = setTimeout(refetch, Math.min(Math.max(delay, 0) + 1000, MAX_TIMEOUT));
    return () => clearTimeout(timer);
  }, [opensAt, refetch]);

  const handleDownload = async () => {
    if (downloading) return;

    try {
      setDownloading(true);

      const blob = await downloadSubjectZip();

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = "subject.zip";

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Erreur lors du téléchargement du sujet :", err);
    } finally {
      setDownloading(false);
    }
  };

  if (loading && !notOpen) {
    return <Spinner />;
  }

  // Sujet pas encore publié : simple message d'information
  if (notOpen) {
    return (
      <div className={`${card} text-center`}>
        <Clock className="mx-auto mb-4 size-10 text-primary/40" />

        <h2 className="text-lg font-bold text-primary">
          {t("notOpen.title")}
        </h2>

        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
          {t("notOpen.description")}
        </p>

        {opensAt && !Number.isNaN(new Date(opensAt).getTime()) && (
          <p className="mt-4 text-sm font-semibold text-primary">
            {t("notOpen.opensAt", {
              date: new Date(opensAt).toLocaleString(locale, {
                dateStyle: "long",
                timeStyle: "short",
              }),
            })}
          </p>
        )}
      </div>
    );
  }

  if (error) {
    return <Alert type="error">{t("errors.load")}</Alert>;
  }

  if (!subject) {
    return (
      <div className={`${card} text-center`}>
        <FileText className="mx-auto mb-4 size-10 text-primary/40" />

        <h2 className="text-lg font-bold text-primary">
          {t("empty.title")}
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          {t("empty.description")}
        </p>
      </div>
    );
  }

  const hasFiles = (subject.files?.length ?? 0) > 0;

  return (
    <section className="space-y-6">
      {/* Sujet : icône + titre/description + bouton sur la même ligne */}
      <div className={card}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent-light">
              <FileText className="size-5 text-primary" />
            </div>

            <div className="min-w-0">
              <h2 className={sectionTitle}>{t("card.title")}</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {t("card.description")}
              </p>
            </div>
          </div>

          {hasFiles && (
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className={`${btn.primary} shrink-0`}
            >
              {downloading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Download className="size-4" />
              )}

              {downloading ? t("documents.downloading") : t("download")}
            </button>
          )}
        </div>
      </div>

      {/* Documents */}
      <DocumentsList files={subject.files || []} onRefresh={refetch} />

      {/* Addenda */}
      <AddendaList
        addenda={subject.addenda || []}
        locale={locale}
        onRefresh={refetch}
      />
    </section>
  );
}