"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";

// initialDate : date ISO actuelle (opensAt), onSuccess : rechargement des données
export default function SessionDatePicker({ initialDate, onSuccess }) {
  const t = useTranslations("subject");

  const [date, setDate] = useState(
    initialDate ? new Date(initialDate).toISOString().slice(0, 10) : ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!date) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await api("/api/admin/subject/session-open", {
        method: "PATCH",
        body: { sessionOpen: new Date(date).toISOString() },
      });

      await onSuccess?.();
    } catch (err) {
      console.error("Erreur lors de la mise à jour de la date de session :", err);

      if (err.code === "INVALID_DATE") {
        setError("Date invalide.");
      } else {
        setError(t("admin.session.errors.update")); // ⚠️ adapte la clé
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 sm:flex-row sm:items-end"
    >
      <div className="flex-1">
        <label
          htmlFor="session-date"
          className="mb-2 block text-sm font-medium text-gray-900"
        >
          {t("admin.session.label")} {/* ⚠️ adapte la clé */}
        </label>

        <input
          id="session-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          disabled={loading}
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500 disabled:bg-gray-100"
        />
      </div>

      <button
        type="submit"
        disabled={loading || !date}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {t("admin.session.save")} {/* ⚠️ adapte la clé */}
      </button>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}