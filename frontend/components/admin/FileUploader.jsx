"use client";

import { useRef, useState } from "react";
import { FileUp, X, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";

export default function FileUploader({ onSuccess }) {
  const t = useTranslations("subject");
  const inputRef = useRef(null);

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSelect = (event) => {
    const selected = Array.from(event.target.files || []);
    setFiles((current) => [...current, ...selected]);
    event.target.value = "";
  };

  const removeFile = (index) => {
    setFiles((current) => current.filter((_, i) => i !== index));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!files.length || loading) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Le serveur accepte un seul fichier par requête
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("kind", "annexe"); // enonce | donnees | annexe
        formData.append("title", file.name);

        await api("/api/admin/subject/files", {
          method: "POST",
          body: formData,
        });
      }

      setFiles([]);
      await onSuccess?.();
    } catch (err) {
      console.error("Erreur lors de l'ajout des fichiers :", err);
      setError(t("admin.files.errors.upload")); // ⚠️ adapte la clé
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <input
        ref={inputRef}
        type="file"
        multiple
        onChange={handleSelect}
        className="hidden"
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 px-6 py-12 text-center transition hover:bg-gray-50 disabled:opacity-50"
      >
        <FileUp className="h-9 w-9 text-gray-500" />
        <span className="text-sm font-medium text-gray-900">
          {t("admin.files.select")} {/* ⚠️ adapte la clé */}
        </span>
      </button>

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm text-gray-900">{file.name}</p>
                <p className="text-xs text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>

              <button
                type="button"
                onClick={() => removeFile(index)}
                disabled={loading}
                className="text-gray-500 hover:text-gray-900"
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading || !files.length}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {t("admin.files.upload")} {/* ⚠️ adapte la clé */}
        </button>
      </div>
    </form>
  );
}