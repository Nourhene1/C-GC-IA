"use client";

import { FileText } from "lucide-react";
import { useTranslations } from "next-intl";
import DownloadButton from "./DownloadButton";

export default function DocumentsList({ files = [] }) {
  const t = useTranslations("subject");

  if (!files.length) {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-gray-900">
            {t("documents.title")}
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            {t("documents.description")}
          </p>
        </div>

        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 px-6 py-10 text-center">
          <FileText className="mb-3 h-9 w-9 text-gray-400" />

          <p className="text-sm text-gray-500">
            {t("documents.empty")}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-gray-900">
          {t("documents.title")}
        </h3>

        <p className="mt-1 text-sm text-gray-500">
          {t("documents.description")}
        </p>
      </div>

      <div className="space-y-3">
        {files.map((file) => (
          <div
            key={file._id || file.id}
            className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 p-4 transition hover:border-gray-300 hover:bg-gray-50"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                <FileText className="h-5 w-5 text-gray-600" />
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-900">
                  {file.originalName || file.filename || file.name}
                </p>

                {file.size && (
                  <p className="mt-1 text-xs text-gray-500">
                    {file.size}
                  </p>
                )}
              </div>
            </div>

            <DownloadButton fileId={file._id || file.id} />
          </div>
        ))}
      </div>
    </section>
  );
}