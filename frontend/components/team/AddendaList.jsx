"use client";

import { FileText, CalendarDays } from "lucide-react";
import { useTranslations } from "next-intl";

export default function AddendaList({ addenda = [], locale }) {
  const t = useTranslations("subject");

  const getLocalizedValue = (value) => {
    if (!value) return "";

    if (typeof value === "string") {
      return value;
    }

    return value[locale] || value.fr || value.en || "";
  };

  if (!addenda.length) {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-gray-900">
            {t("addenda.title")}
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            {t("addenda.description")}
          </p>
        </div>

        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 px-6 py-10 text-center">
          <FileText className="mb-3 h-9 w-9 text-gray-400" />

          <p className="text-sm text-gray-500">
            {t("addenda.empty")}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-gray-900">
          {t("addenda.title")}
        </h3>

        <p className="mt-1 text-sm text-gray-500">
          {t("addenda.description")}
        </p>
      </div>

      <div className="space-y-3">
        {addenda.map((addendum, index) => (
          <div
            key={addendum._id || addendum.id || index}
            className="rounded-xl border border-gray-200 p-4"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                <FileText className="h-5 w-5 text-gray-600" />
              </div>

              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-semibold text-gray-900">
                  {getLocalizedValue(addendum.title || addendum.name)}
                </h4>

                {addendum.description && (
                  <p className="mt-1 text-sm leading-5 text-gray-600">
                    {getLocalizedValue(addendum.description)}
                  </p>
                )}

                {addendum.createdAt && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                    <CalendarDays className="h-3.5 w-3.5" />

                    <span>
                      {new Date(addendum.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}