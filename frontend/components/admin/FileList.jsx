"use client";

import { useState } from "react";
import { FileText, Trash2, Loader2, Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { downloadSubjectFile } from "@/lib/subject";
import { api } from "@/lib/api";

export default function FileList({ files = [], onRefresh }) {
  const t = useTranslations("subject");

  const [downloadingId, setDownloadingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);

  const getFileName = (file) =>
    file.originalName ||
    file.filename ||
    file.name ||
    t("documents.defaultFileName");

  const handleDownload = async (file) => {
    const fileId = file._id || file.id;

    if (!fileId || downloadingId) {
      return;
    }

    try {
      setDownloadingId(fileId);
      setError(null);

      const blob = await downloadSubjectFile(fileId);
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = getFileName(file);

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Erreur lors du téléchargement du fichier :", err);
      setError(t("admin.files.errors.download"));
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (file) => {
    const fileId = file._id || file.id;

    if (!fileId || deletingId) {
      return;
    }

    try {
      setDeletingId(fileId);
      setError(null);

      await api(`/api/admin/subject/files/${fileId}`, {
        method: "DELETE",
      });

      await onRefresh?.();
    } catch (err) {
      console.error("Erreur lors de la suppression du fichier :", err);
      setError(t("admin.files.errors.delete"));
    } finally {
      setDeletingId(null);
    }
  };

  if (!files.length) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 px-6 py-10 text-center">
        <FileText className="mx-auto mb-3 h-9 w-9 text-gray-400" />

        <p className="text-sm text-gray-500">{t("admin.files.empty")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {files.map((file, index) => {
        const fileId = file._id || file.id;
        const isDownloading = downloadingId === fileId;
        const isDeleting = deletingId === fileId;

        return (
          <div
            key={fileId || index}
            className="flex flex-col gap-4 rounded-xl border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                <FileText className="h-5 w-5 text-gray-600" />
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-900">
                  {getFileName(file)}
                </p>

                {file.size && (
                  <p className="mt-1 text-xs text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => handleDownload(file)}
                disabled={isDownloading || isDeleting}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isDownloading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}

                <span className="hidden md:inline">
                  {isDownloading
                    ? t("admin.files.downloading")
                    : t("admin.files.download")}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleDelete(file)}
                disabled={isDownloading || isDeleting}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}

                <span className="hidden md:inline">
                  {isDeleting
                    ? t("admin.files.deleting")
                    : t("admin.files.delete")}
                </span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}