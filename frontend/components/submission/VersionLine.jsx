"use client";
import { ExternalLink, AlertTriangle } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { btn } from "@/components/ui/styles";
import { formatSize } from "@/lib/submission";
import DownloadButton from "./DownloadButton";

export default function VersionLine({ version, fetcher }) {
  const t = useTranslations("submission");
  const format = useFormatter();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-primary">
          <span className="truncate">{version.originalName ?? version.url}</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
            v{version.version}
          </span>
          {version.late && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700">
              <AlertTriangle className="size-3" /> {t("current.late")}
            </span>
          )}
        </p>
        <p className="mt-0.5 text-xs text-slate-500">
          {format.dateTime(new Date(version.receivedAt), { dateStyle: "medium", timeStyle: "medium" })}
          {version.size != null && ` · ${formatSize(version.size)}`}
          {version.sha256 && ` · SHA-256 ${version.sha256.slice(0, 12)}…`}
        </p>
      </div>

      {version.url ? (
        <a href={version.url} target="_blank" rel="noopener noreferrer" className={btn.ghost}>
          <ExternalLink className="size-4" /> {t("actions.open")}
        </a>
      ) : (
        <DownloadButton fetcher={fetcher} filename={version.originalName ?? "file"} />
      )}
    </div>
  );
}