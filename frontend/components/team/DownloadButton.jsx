
"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { downloadSubjectZip } from "@/lib/subject";
import { btn } from "@/components/ui/styles";

export default function DownloadSubjectButton() {
  const t = useTranslations("subject");
  const [downloading, setDownloading] = useState(false);

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
      console.error(
        "Erreur lors du téléchargement du sujet :",
        err
      );
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={downloading}
      className={btn.primary}
    >
      {downloading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Download className="size-4" />
      )}

      {downloading
        ? t("documents.downloading")
        : t("download")}
    </button>
  );
}
