"use client";
import { useState } from "react";
import { BookOpen, Plus, RefreshCw } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import useSubject from "@/lib/hooks/useSubject";
import Spinner from "@/components/ui/Spinner";
import { ErrorAlert } from "@/components/ui/Alert";
import { btn, card, sectionTitle } from "@/components/ui/styles";
import FileUploader from "./FileUploader";
import FileList from "./FileList";
import AddendumForm from "./AddendumForm";
import SessionDatePicker from "./SessionDatePicker";

export default function SubjectManager() {
  const t = useTranslations("subject");
  const tc = useTranslations("common");
  const locale = useLocale();
  const { subject, loading, error, refetch } = useSubject({ admin: true });

  const [showUploader, setShowUploader] = useState(false);
  const [showAddendumForm, setShowAddendumForm] = useState(false);

  // Champs multilingues renvoyés par l'API sous la forme { fr, en }
  const tr = (value) =>
    value && typeof value === "object"
      ? value[locale] || value.fr || ""
      : value || "";

  const handleSuccess = async () => {
    await refetch();
    setShowUploader(false);
    setShowAddendumForm(false);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* En-tête */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-primary">
            <BookOpen className="size-6 text-accent" /> {t("admin.pageTitle")}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{t("admin.pageDescription")}</p>
        </div>
        <button type="button" onClick={refetch} disabled={loading} className={btn.outline}>
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          {t("actions.refresh")}
        </button>
      </div>

      <ErrorAlert error={error} />

      {!subject && loading ? (
        <Spinner label={tc("loading")} />
      ) : !subject ? null : (
        <>
          {/* Documents */}
          <section className={card}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className={sectionTitle}>{t("admin.documents.title")}</h2>
                <p className="mt-1 text-sm text-slate-500">{t("admin.documents.description")}</p>
              </div>
              <button type="button" className={btn.primary}
                onClick={() => setShowUploader((v) => !v)}>
                <Plus className="size-4" /> {t("admin.documents.add")}
              </button>
            </div>

            {showUploader && (
              <div className="mt-6 border-t border-slate-100 pt-6">
                <FileUploader onSuccess={handleSuccess} />
              </div>
            )}

            <div className="mt-6">
              <FileList files={subject.files || []} onRefresh={refetch} />
            </div>
          </section>

          {/* Addenda */}
          <section className={card}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className={sectionTitle}>{t("admin.addenda.title")}</h2>
                <p className="mt-1 text-sm text-slate-500">{t("admin.addenda.description")}</p>
              </div>
              <button type="button" className={btn.primary}
                onClick={() => setShowAddendumForm((v) => !v)}>
                <Plus className="size-4" /> {t("admin.addenda.add")}
              </button>
            </div>

            {showAddendumForm && (
              <div className="mt-6 border-t border-slate-100 pt-6">
                <AddendumForm onSuccess={handleSuccess} />
              </div>
            )}

            <div className="mt-6">
              {subject.addenda?.length ? (
                <ul className="flex flex-col gap-3">
                  {subject.addenda.map((a, i) => (
                    <li key={a.id || i} className="rounded-xl border border-slate-200 p-4">
                      <h3 className="text-sm font-bold text-primary">{tr(a.title)}</h3>
                      {a.content && (
                        <p className="mt-1 whitespace-pre-line text-sm text-slate-600">
                          {tr(a.content)}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 px-6 py-8 text-center text-sm text-slate-500">
                  {t("admin.addenda.empty")}
                </div>
              )}
            </div>
          </section>

          {/* Date de session */}
          <section className={card}>
            <h2 className={sectionTitle}>{t("admin.session.title")}</h2>
            <p className="mb-5 mt-1 text-sm text-slate-500">{t("admin.session.description")}</p>
            <SessionDatePicker initialDate={subject.opensAt || null} onSuccess={refetch} />
          </section>
        </>
      )}
    </div>
  );
}