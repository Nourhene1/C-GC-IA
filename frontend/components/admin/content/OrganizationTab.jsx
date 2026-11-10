
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  UserRound,
  ImagePlus,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";

import Spinner from "@/components/ui/Spinner";
import { btn, card } from "@/components/ui/styles";
import { api, publicFileUrl } from "@/lib/api";
import { LOGO_MAX_MB } from "@/lib/constants";
import { smallInput } from "./TextPair";

const BASE = "/api/admin/organization";

const EMPTY = {
  firstName: "",
  lastName: "",
  role: "",
  order: 0,
};

// Formulaire d'ajout / modification d'un membre
function MemberForm({ initial, onCancel, onSaved, onError }) {
  const t = useTranslations("adminContent");
  const tc = useTranslations("common");

  const fileInput = useRef(null);
  const isEdit = Boolean(initial?._id);

  const [form, setForm] = useState(
    initial ? { ...EMPTY, ...initial } : EMPTY
  );

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreview(url);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  const currentPhoto =
    preview ||
    (!removePhoto && initial?.photo
      ? publicFileUrl(initial.photo)
      : null);

  const pickFile = (e) => {
    const f = e.target.files[0];
    e.target.value = "";

    if (!f) return;

    if (f.size > LOGO_MAX_MB * 1024 * 1024) {
      return onError("FILE_TOO_LARGE");
    }

    setFile(f);
    setRemovePhoto(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);

    const data = new FormData();

    data.append("firstName", form.firstName);
    data.append("lastName", form.lastName);
    data.append("role", form.role);
    data.append("order", form.order ?? 0);

    if (file) {
      data.append("photo", file);
    }

    if (removePhoto) {
      data.append("removePhoto", "true");
    }

    try {
      await api(
        isEdit ? `${BASE}/${initial._id}` : BASE,
        {
          method: isEdit ? "PUT" : "POST",
          body: data,
        }
      );

      await onSaved();
    } catch (err) {
      onError(err);
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className={`${card} flex flex-col gap-4 border-2 border-accent/30`}
    >
      <h3 className="font-bold text-primary">
        {isEdit ? t("editMember") : t("addMember")}
      </h3>

      <div className="flex flex-col gap-4 sm:flex-row">
        {/* Photo facultative */}
        <div className="flex shrink-0 flex-col items-center gap-2 sm:w-28">
          <div className="flex size-20 items-center justify-center overflow-hidden rounded-full bg-accent-light">
            {currentPhoto ? (
              <img
                src={currentPhoto}
                alt=""
                className="size-full object-cover"
              />
            ) : (
              <UserRound className="size-9 text-accent" />
            )}
          </div>

          <input
            ref={fileInput}
            type="file"
            accept=".png,.jpg,.jpeg,.webp"
            className="sr-only"
            onChange={pickFile}
          />

          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-primary transition hover:border-accent hover:text-accent"
          >
            <ImagePlus className="size-3.5" />
            {currentPhoto ? t("changePhoto") : t("addPhoto")}
          </button>

          {currentPhoto && (
            <button
              type="button"
              onClick={() => {
                setFile(null);
                setRemovePhoto(true);
              }}
              className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700"
            >
              <Trash2 className="size-3.5" />
              {t("removePhoto")}
            </button>
          )}
        </div>

        {/* Champs du membre */}
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              className={smallInput}
              placeholder={t("lastName")}
              aria-label={t("lastName")}
              required
              maxLength={80}
              value={form.lastName}
              onChange={(e) =>
                setForm({ ...form, lastName: e.target.value })
              }
            />

            <input
              className={smallInput}
              placeholder={t("firstName")}
              aria-label={t("firstName")}
              required
              maxLength={80}
              value={form.firstName}
              onChange={(e) =>
                setForm({ ...form, firstName: e.target.value })
              }
            />
          </div>

          <input
            className={smallInput}
            placeholder={t("organizationRole")}
            aria-label={t("organizationRole")}
            required
            maxLength={150}
            value={form.role}
            onChange={(e) =>
              setForm({ ...form, role: e.target.value })
            }
          />

          <input
            className={`${smallInput} sm:w-40`}
            type="number"
            min={0}
            placeholder={t("order")}
            aria-label={t("order")}
            value={form.order}
            onChange={(e) =>
              setForm({ ...form, order: e.target.value })
            }
          />

          <p className="text-xs text-slate-500">
            {t("orderHint")}
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className={btn.outline}
        >
          {tc("cancel")}
        </button>

        <button
          type="submit"
          disabled={busy}
          className={btn.primary}
        >
          {busy ? tc("saving") : tc("save")}
        </button>
      </div>
    </form>
  );
}

// Comité d'organisation
export default function OrganizationTab({ onError }) {
  const t = useTranslations("adminContent");
  const tc = useTranslations("common");

  const [members, setMembers] = useState(null);
  const [editing, setEditing] = useState(null);

  // Gestion de la popup de suppression
  const [deletingMember, setDeletingMember] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(
    () =>
      api(BASE)
        .then((d) => setMembers(d.members))
        .catch(onError),
    [onError]
  );

  useEffect(() => {
    load();
  }, [load]);

  const saved = async () => {
    setEditing(null);
    await load();
  };

  // Suppression du membre après confirmation
  const remove = async () => {
    if (!deletingMember || deleting) return;

    setDeleting(true);

    try {
      await api(`${BASE}/${deletingMember._id}`, {
        method: "DELETE",
      });

      setDeletingMember(null);
      await load();
    } catch (err) {
      onError(err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-light">
            <UserRound className="size-5 text-accent" />
          </span>

          <div>
            <h3 className="text-lg font-bold text-primary">
              {t("organizationTitle")}
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {t("organizationDescription")}
            </p>
          </div>
        </div>

        {!editing && (
          <button
            onClick={() => setEditing("new")}
            className={btn.primary}
          >
            <Plus className="size-4" />
            {t("addMember")}
          </button>
        )}
      </div>

      {editing && (
        <MemberForm
          key={editing._id || "new"}
          initial={editing === "new" ? null : editing}
          onCancel={() => setEditing(null)}
          onSaved={saved}
          onError={onError}
        />
      )}

      {!members ? (
        <Spinner />
      ) : members.length === 0 ? (
        <p className="text-center text-slate-500">
          {t("noMembers")}
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {members.map((m) => (
            <li
              key={m._id}
              className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4"
            >
              <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent-light">
                {m.photo ? (
                  <img
                    src={publicFileUrl(m.photo)}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  <UserRound className="size-7 text-accent" />
                )}
              </span>

              <div className="min-w-0 flex-1">
                <p className="font-bold text-primary">
                  {m.firstName} {m.lastName}
                </p>

                <p className="text-sm text-slate-500">
                  {m.role}
                </p>
              </div>

              <div className="flex gap-1">
                <button
                  onClick={() => setEditing(m)}
                  className={btn.ghost}
                  aria-label={t("editMember")}
                >
                  <Pencil className="size-4" />
                </button>

                <button
                  onClick={() => setDeletingMember(m)}
                  className={btn.danger}
                  aria-label={t("removePhoto")}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Popup de confirmation de suppression */}
      {deletingMember && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => !deleting && setDeletingMember(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-member-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex size-12 items-center justify-center rounded-full bg-red-50">
              <Trash2 className="size-6 text-red-600" />
            </div>

            <h3
              id="delete-member-title"
              className="mt-4 text-lg font-bold text-primary"
            >
              {t("confirmDeleteMember", {
                name: `${deletingMember.firstName} ${deletingMember.lastName}`,
              })}
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Cette action est irréversible. Voulez-vous vraiment continuer ?
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingMember(null)}
                disabled={deleting}
                className={btn.outline}
              >
                {tc("cancel")}
              </button>

              <button
                type="button"
                onClick={remove}
                disabled={deleting}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? (
                  <Spinner />
                ) : (
                  <Trash2 className="size-4" />
                )}
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
