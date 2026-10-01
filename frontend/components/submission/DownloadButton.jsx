"use client";
import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { btn } from "@/components/ui/styles";
import { saveBlob } from "@/lib/submission";

// fetcher() renvoie un Blob ; filename = nom proposé à l'enregistrement
export default function DownloadButton({ fetcher, filename }) {
  const t = useTranslations("submission");
  const [busy, setBusy] = useState(false);

  const click = async () => {
    setBusy(true);
    try {
      saveBlob(await fetcher(), filename);
    } catch (err) {
      console.error("Téléchargement :", err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button type="button" onClick={click} disabled={busy} className={btn.ghost}>
      {busy ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
      {t("actions.download")}
    </button>
  );
}