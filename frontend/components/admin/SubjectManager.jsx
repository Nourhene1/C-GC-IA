"use client";
import { useState } from "react";
import {
  BookOpen, Plus, RefreshCw, Pencil, Trash2, X, Lock, CircleCheck, EyeOff,
} from "lucide-react";
import { useTranslations, useLocale, useFormatter } from "next-intl";
import useSubject from "@/lib/hooks/useSubject";
import Spinner from "@/components/ui/Spinner";
import { ErrorAlert } from "@/components/ui/Alert";
import { btn, card, sectionTitle } from "@/components/ui/styles";
import { api } from "@/lib/api";
import FileUploader from "./FileUploader";
import FileList from "./FileList";
import AddendumForm from "./AddendumForm";
import SessionDatePicker from "./SessionDatePicker";

export default function SubjectManager() {
  const t = useTranslations("subject");
  const tc = useTranslations("common");
  const locale = useLocale();
  const format = useFormatter();
  const { subject, loading, error, refetch } = useSubject({ admin: true });

  const [showUploader, setShowUploader] = useState(false);
  const [showAddendumForm, setShowAddendumForm] = useState(false);

  // Modification / suppression d'un addendum
  const [editingId, setEditingId] = useState(null);
  const [addendumToDelete, setAddendumToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Champs multilingues renvoyés par l'API sous la forme { fr, en }
  const tr = (value) =>
    value && typeof value === "object"
      ? value[locale] || value.fr || ""
      : value || "";

  const handleSuccess = async () => {
    await refetch();
    setShowUploader(false);
    setShowAddendumForm(false);
    setEditingId(null);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await api(`/api/admin/subject/addenda/${addendumToDelete.id}`, {
        method: "DELETE",
      });
      setAddendumToDelete(null);
      await refetch();
    } catch (err) {
      setDeleteError(err);
    } finally {
      setDeleting(false);
    }
  };

  const isOpen = !!subject?.isOpen;
  const opensAtLabel = subject?.opensAt
    ? format.dateTime(new Date(subject.opensAt), {
        dateStyle: "long",
        timeStyle: "short",
      })
    : null;

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
          {/* 1. Date d'ouverture */}
          <section className={card}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className={sectionTitle}>{t("admin.session.title")}</h2>
                <p className="mt-1 text-sm text-slate-500">{t("admin.session.description")}</p>
              </div>
              {isOpen ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                  <CircleCheck className="size-3.5" />
                  {t("admin.session.statusOpen")}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                  <EyeOff className="size-3.5" />
                  {t("admin.session.statusHidden")}
                </span>
              )}
            </div>
            <div className="mt-5">
              <SessionDatePicker initialDate={subject.opensAt || null} onSuccess={refetch} />
            </div>
          </section>

          {/* 2. Documents */}
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

          {/* 3. Addenda : verrouillée tant que le sujet n'est pas ouvert */}
          <section className={`${card} ${!isOpen ? "bg-slate-50/60" : ""}`}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className={`${sectionTitle} flex items-center gap-2`}>
                  {!isOpen && <Lock className="size-4 text-slate-400" />}
                  {t("admin.addenda.title")}
                </h2>
                <p className="mt-1 text-sm text-slate-500">{t("admin.addenda.description")}</p>
              </div>
              <button
                type="button"
                className={`${btn.primary} disabled:cursor-not-allowed disabled:opacity-50`}
                disabled={!isOpen}
                onClick={() => {
                  setShowAddendumForm((v) => !v);
                  setEditingId(null);
                }}
              >
                <Plus className="size-4" /> {t("admin.addenda.add")}
              </button>
            </div>

            {!isOpen && (
              <div className="mt-6 flex items-start gap-3 rounded-xl border border-dashed border-slate-300 bg-white px-5 py-4">
                <Lock className="mt-0.5 size-5 shrink-0 text-slate-400" />
                <div>
                  <p className="text-sm font-semibold text-primary">
                    {t("admin.addenda.lockedTitle")}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {opensAtLabel
                      ? t("admin.addenda.lockedDescription", { date: opensAtLabel })
                      : t("admin.addenda.lockedNoDate")}
                  </p>
                </div>
              </div>
            )}

            {isOpen && showAddendumForm && (
              <div className="mt-6 border-t border-slate-100 pt-6">
                <AddendumForm
                  onSuccess={handleSuccess}
                  onCancel={() => setShowAddendumForm(false)}
                />
              </div>
            )}

            {/* Liste : toujours affichée si des addenda existent, sinon seulement quand ouvert */}
            {(isOpen || subject.addenda?.length > 0) && (
              <div className="mt-6">
                {subject.addenda?.length ? (
                  <ul className="flex flex-col gap-3">
                    {subject.addenda.map((a, i) => (
                      <li key={a.id || i} className="rounded-xl border border-slate-200 bg-white p-4">
                        {editingId === a.id ? (
                          <AddendumForm
                            addendum={a}
                            onSuccess={handleSuccess}
                            onCancel={() => setEditingId(null)}
                          />
                        ) : (
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <h3 className="flex flex-wrap items-center gap-2 text-sm font-bold text-primary">
                                {tr(a.title)}
                                {a.version > 1 && (
                                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
                                    v{a.version}
                                  </span>
                                )}
                              </h3>
                              {a.content && (
                                <p className="mt-1 whitespace-pre-line text-sm text-slate-600">
                                  {tr(a.content)}
                                </p>
                              )}
                            </div>

                            <div className="flex shrink-0 gap-1">
                              <button type="button" className={btn.ghost}
                                onClick={() => {
                                  setEditingId(a.id);
                                  setShowAddendumForm(false);
                                }}>
                                <Pencil className="size-4" /> {tc("edit")}
                              </button>
                              <button type="button" className={btn.ghost}
                                onClick={() => {
                                  setDeleteError(null);
                                  setAddendumToDelete(a);
                                }}>
                                <Trash2 className="size-4 text-red-500" /> {tc("delete")}
                              </button>
                            </div>
                          </div>
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
            )}
          </section>
        </>
      )}

      {/* Modale de confirmation de suppression */}
      {addendumToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-addendum-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 id="delete-addendum-title" className="text-lg font-bold text-ink">
                  {t("admin.addenda.delete")}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {t("admin.addenda.confirmDelete", {
                    title: tr(addendumToDelete.title),
                  })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAddendumToDelete(null)}
                disabled={deleting}
                className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label={tc("cancel")}
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="mt-4">
              <ErrorAlert error={deleteError} />
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAddendumToDelete(null)}
                disabled={deleting}
                className={btn.outline}
              >
                {tc("cancel")}
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className={btn.primary}
              >
                <Trash2 className="size-4" />
                {deleting ? tc("saving") : tc("delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}