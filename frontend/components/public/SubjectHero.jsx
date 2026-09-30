"use client";

import { FileText, Download, CalendarDays } from "lucide-react";
import { useTranslations } from "next-intl";
import useSubject from "@/lib/hooks/useSubject";
import { downloadSubjectZip } from "@/lib/subject";

export default function SubjectHero() {
  const t = useTranslations("subject");
  const { subject, loading, error } = useSubject();

  const handleDownload = async () => {
    try {
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
    }
  };

  if (loading) {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-2/3 rounded bg-gray-200" />
          <div className="h-4 w-1/2 rounded bg-gray-200" />
          <div className="h-10 w-40 rounded bg-gray-200" />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-2xl border border-red-200 bg-red-50 p-8">
        <p className="text-sm text-red-600">{t("errors.load")}</p>
      </section>
    );
  }

  if (!subject) {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <FileText className="mx-auto mb-4 h-10 w-10 text-gray-400" />

        <h2 className="text-lg font-semibold text-gray-900">
          {t("empty.title")}
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          {t("empty.description")}
        </p>
      </section>
    );
  }

  const hasFiles = (subject.files?.length ?? 0) > 0;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-100">
            <FileText className="h-6 w-6 text-gray-700" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {t("public.title")}
            </h1>

            {subject.opensAt && (
              <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                <CalendarDays className="h-4 w-4" />

                <span>
                  {new Date(subject.opensAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {hasFiles && (
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            <Download className="h-4 w-4" />

            {t("download")}
          </button>
        )}
      </div>
    </section>
  );
}