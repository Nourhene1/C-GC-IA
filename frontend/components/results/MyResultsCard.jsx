"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Trophy, Download, ArrowRight, LoaderCircle } from "lucide-react";
import { ErrorAlert } from "@/components/ui/Alert";
import { btn, card } from "@/components/ui/styles";
import { getPublicResults, downloadMyCertificate } from "@/lib/results";

// Tableau de bord des participants : résultats publiés + attestation (F7.6)
export default function MyResultsCard() {
  const t = useTranslations("results");
  const locale = useLocale();
  const [published, setPublished] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    getPublicResults().then(() => setPublished(true)).catch(() => setPublished(false));
  }, []);

  if (!published) return null;

  const download = async () => {
    setBusy(true);
    setError(null);
    try {
      await downloadMyCertificate(locale);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`${card} flex flex-col gap-4`}>
      <div className="flex items-start gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent-light">
          <Trophy className="size-6 text-accent" />
        </span>
        <div>
          <h2 className="text-xl font-bold text-primary">{t("dashboard.title")}</h2>
          <p className="mt-1 text-slate-600">{t("dashboard.text")}</p>
        </div>
      </div>
      <ErrorAlert error={error} />
      <div className="flex flex-wrap gap-3">
        <Link href="/resultats" className={btn.secondary}>{t("dashboard.view")} <ArrowRight className="size-4" /></Link>
        <button type="button" onClick={download} disabled={busy} className={btn.primary}>
          {busy ? <LoaderCircle className="size-4 animate-spin" /> : <Download className="size-4" />} {t("dashboard.certificate")}
        </button>
      </div>
    </div>
  );
}
