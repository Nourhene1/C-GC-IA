"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";

export default function AddendumForm({ addendum = null, onSuccess, onCancel }) {
  const t = useTranslations("subject");
  const tc = useTranslations("common");
  const isEdit = !!addendum;

  const [form, setForm] = useState({
    title: addendum?.title?.fr ?? "",
    description: addendum?.content?.fr ?? "",
  });
  const [notify, setNotify] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.title.trim() || !form.description.trim()) {
      setError(t("admin.addenda.errors.titleRequired"));
      return;
    }

    const payload = {
      title: { fr: form.title.trim() },
      content: { fr: form.description.trim() },
    };

    try {
      setLoading(true);
      setError(null);

      if (isEdit) {
        await api(`/api/admin/subject/addenda/${addendum.id}`, {
          method: "PUT",
          body: { ...payload, notify },
        });
      } else {
        await api("/api/admin/subject/addenda", {
          method: "POST",
          body: payload,
        });
        setForm({ title: "", description: "" });
      }

      await onSuccess?.();
    } catch (err) {
      console.error(
        isEdit
          ? "Erreur lors de la modification de l'addendum :"
          : "Erreur lors de la création de l'addendum :",
        err
      );

      if (err.code === "SUBJECT_NOT_OPEN") {
        setError(
          "Le sujet n'est pas encore ouvert : impossible de créer un addendum."
        );
      } else if (err.code === "VALIDATION_ERROR") {
        setError(t("admin.addenda.errors.titleRequired"));
      } else if (err.code === "NOT_FOUND") {
        setError(t("admin.addenda.errors.notFound"));
      } else {
        setError(
          isEdit
            ? t("admin.addenda.errors.update")
            : t("admin.addenda.errors.create")
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label
          htmlFor={`addendum-title-${addendum?.id ?? "new"}`}
          className="mb-2 block text-sm font-medium text-gray-900"
        >
          {t("admin.addenda.fields.title")}
        </label>

        <input
          id={`addendum-title-${addendum?.id ?? "new"}`}
          name="title"
          type="text"
          value={form.title}
          onChange={handleChange}
          disabled={loading}
          placeholder={t("admin.addenda.fields.titlePlaceholder")}
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-1 focus:ring-gray-500 disabled:bg-gray-100"
        />
      </div>

      <div>
        <label
          htmlFor={`addendum-description-${addendum?.id ?? "new"}`}
          className="mb-2 block text-sm font-medium text-gray-900"
        >
          {t("admin.addenda.fields.description")}
        </label>

        <textarea
          id={`addendum-description-${addendum?.id ?? "new"}`}
          name="description"
          value={form.description}
          onChange={handleChange}
          disabled={loading}
          rows={5}
          placeholder={t("admin.addenda.fields.descriptionPlaceholder")}
          className="w-full resize-y rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-1 focus:ring-gray-500 disabled:bg-gray-100"
        />
      </div>

      {isEdit && (
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={notify}
            onChange={(e) => setNotify(e.target.checked)}
            disabled={loading}
          />
          {t("admin.addenda.fields.notify")}
        </label>
      )}

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {tc("cancel")}
          </button>
        )}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}

          {isEdit
            ? loading
              ? t("admin.addenda.updating")
              : t("admin.addenda.update")
            : loading
            ? t("admin.addenda.creating")
            : t("admin.addenda.create")}
        </button>
      </div>
    </form>
  );
}