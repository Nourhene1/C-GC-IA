"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Handshake,
  Plus,
  Pencil,
  Trash2,
  ImagePlus,
  ExternalLink,
  AlertTriangle,
  X,
} from "lucide-react";

import RequireAuth from "@/components/auth/RequireAuth";
import AppShell from "@/components/layout/AppShell";
import Field from "@/components/ui/Field";
import Select from "@/components/ui/Select";
import Spinner from "@/components/ui/Spinner";
import { ErrorAlert } from "@/components/ui/Alert";
import { btn, card } from "@/components/ui/styles";
import { api, publicFileUrl } from "@/lib/api";
import { LOGO_ACCEPT, LOGO_MAX_MB } from "@/lib/constants";

const TIERS = ["platine", "or", "argent", "bronze", "partenaire"];

const EMPTY = {
  name: "",
  website: "",
  tier: "partenaire",
  order: 0,
};

// Formulaire d'ajout / modification d'un partenaire
function SponsorForm({ initial, onCancel, onSaved }) {
  const t = useTranslations("adminSponsors");
  const tc = useTranslations("common");

  const fileInput = useRef(null);

  const [form, setForm] = useState(initial || EMPTY);
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const pickFile = (e) => {
    const f = e.target.files[0];

    if (f && f.size > LOGO_MAX_MB * 1024 * 1024) {
      setError("FILE_TOO_LARGE");
      e.target.value = "";
      return;
    }

    setError(null);
    setFile(f || null);
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const data = new FormData();

    ["name", "website", "tier", "order"].forEach((k) =>
      data.append(k, form[k] ?? "")
    );

    if (file) {
      data.append("file", file);
    }

    try {
      await api(
        initial?._id
          ? `/api/admin/sponsors/${initial._id}`
          : "/api/admin/sponsors",
        {
          method: initial?._id ? "PUT" : "POST",
          body: data,
        }
      );

      await onSaved();
    } catch (err) {
      setError(err);
      setBusy(false);
    }
  };

  const preview = file
    ? URL.createObjectURL(file)
    : publicFileUrl(initial?.logo);

  return (
    <form
      onSubmit={submit}
      className={`${card} flex flex-col gap-4 border-2 border-accent/30`}
    >
      <h2 className="font-bold text-primary">
        {initial?._id ? t("edit") : t("new")}
      </h2>

      <ErrorAlert error={error} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={t("name")}
          name="name"
          value={form.name}
          onChange={handleChange}
          required
          maxLength={100}
        />

        <Field
          label={t("website")}
          name="website"
          type="url"
          placeholder="https://…"
          value={form.website}
          onChange={handleChange}
        />

        <Select
          label={t("tier")}
          name="tier"
          value={form.tier}
          onChange={handleChange}
          options={TIERS.map((v) => ({
            value: v,
            label: t(`tiers.${v}`),
          }))}
        />

        <Field
          label={t("order")}
          name="order"
          type="number"
          min={0}
          value={form.order}
          onChange={handleChange}
          hint={t("orderHint")}
        />
      </div>

      {/* Aperçu du logo */}
      <div className="flex items-center gap-4">
        <div className="flex size-20 items-center justify-center rounded-xl border border-slate-200 bg-white p-2">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt=""
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <ImagePlus className="size-6 text-slate-300" />
          )}
        </div>

        <input
          ref={fileInput}
          type="file"
          accept={LOGO_ACCEPT}
          className="hidden"
          onChange={pickFile}
        />

        <div>
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className={btn.outline}
          >
            <ImagePlus className="size-4" />
            {t("chooseLogo")}
          </button>

          <p className="mt-1 text-xs text-slate-500">
            {t("logoHint", { max: LOGO_MAX_MB })}
          </p>
        </div>
      </div>

      {/* Actions du formulaire */}
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

// Popup personnalisé de confirmation de suppression
function DeleteSponsorModal({
  sponsor,
  onCancel,
  onConfirm,
  busy,
}) {
  const t = useTranslations("adminSponsors");
  const tc = useTranslations("common");

  useEffect(() => {
    if (!sponsor) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !busy) {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [sponsor, busy, onCancel]);

  if (!sponsor) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) {
          onCancel();
        }
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-sponsor-title"
        aria-describedby="delete-sponsor-description"
        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Bouton de fermeture */}
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          aria-label={tc("cancel")}
          className="absolute right-4 top-4 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
        >
          <X className="size-5" />
        </button>

        {/* Icône d'avertissement */}
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-red-50">
          <AlertTriangle className="size-6 text-red-600" />
        </div>

        <h2
          id="delete-sponsor-title"
          className="text-xl font-bold text-primary"
        >
          {t("confirmDeleteTitle")}
        </h2>

        <p
          id="delete-sponsor-description"
          className="mt-3 text-sm leading-6 text-slate-500"
        >
          {t("confirmDelete", { name: sponsor.name })}
        </p>

        {/* Partenaire concerné */}
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white p-1">
            {sponsor.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={publicFileUrl(sponsor.logo)}
                alt=""
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <Handshake className="size-5 text-slate-300" />
            )}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-700">
              {sponsor.name}
            </p>
            <p className="text-xs text-slate-500">
              {t(`tiers.${sponsor.tier}`)}
            </p>
          </div>
        </div>

        {/* Boutons */}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className={`${btn.outline} justify-center`}
          >
            {tc("cancel")}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? (
              <Spinner />
            ) : (
              <Trash2 className="size-4" />
            )}

            {t("confirmDeleteButton")}
          </button>
        </div>
      </div>
    </div>
  );
}

// Gestion des partenaires
function SponsorsAdmin() {
  const t = useTranslations("adminSponsors");
  const tc = useTranslations("common");

  const [sponsors, setSponsors] = useState(null);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState(null);

  // État du popup de suppression
  const [deletingSponsor, setDeletingSponsor] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(
    () =>
      api("/api/sponsors")
        .then((d) => setSponsors(d.sponsors))
        .catch(setError),
    []
  );

  useEffect(() => {
    load();
  }, [load]);

  const saved = async () => {
    setEditing(null);
    await load();
  };

  // Ouvrir le popup
  const remove = (sponsor) => {
    setError(null);
    setDeletingSponsor(sponsor);
  };

  // Annuler la suppression
  const cancelRemove = useCallback(() => {
    if (!deleting) {
      setDeletingSponsor(null);
    }
  }, [deleting]);

  // Confirmer la suppression
  const confirmRemove = async () => {
    if (!deletingSponsor || deleting) return;

    setDeleting(true);
    setError(null);

    try {
      await api(`/api/admin/sponsors/${deletingSponsor._id}`, {
        method: "DELETE",
      });

      setDeletingSponsor(null);
      await load();
    } catch (err) {
      setError(err);
      setDeletingSponsor(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* En-tête */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-primary">
            <Handshake className="size-6 text-accent" />
            {t("title")}
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            {t("subtitle")}
          </p>
        </div>

        {!editing && (
          <button
            onClick={() => setEditing("new")}
            className={btn.primary}
          >
            <Plus className="size-4" />
            {t("new")}
          </button>
        )}
      </div>

      <ErrorAlert error={error} />

      {/* Formulaire */}
      {editing && (
        <SponsorForm
          key={editing._id || "new"}
          initial={editing === "new" ? null : editing}
          onCancel={() => setEditing(null)}
          onSaved={saved}
        />
      )}

      {/* Liste des partenaires */}
      {!sponsors ? (
        <Spinner />
      ) : sponsors.length === 0 ? (
        <p className={`${card} text-center text-slate-500`}>
          {t("empty")}
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sponsors.map((s) => (
            <li
              key={s._id}
              className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-md shadow-primary/5"
            >
              <div className="flex size-16 shrink-0 items-center justify-center rounded-xl border border-slate-100 p-1.5">
                {s.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={publicFileUrl(s.logo)}
                    alt={s.name}
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <Handshake className="size-6 text-slate-300" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-primary">
                  {s.name}
                </p>

                <p className="text-xs font-semibold text-accent">
                  {t(`tiers.${s.tier}`)}
                </p>

                {s.website && (
                  <a
                    href={s.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex max-w-full items-center gap-1 truncate text-xs text-slate-500 hover:text-accent"
                  >
                    <ExternalLink className="size-3 shrink-0" />
                    <span className="truncate">{s.website}</span>
                  </a>
                )}
              </div>

              <div className="flex flex-col">
                <button
                  onClick={() => setEditing(s)}
                  className={btn.ghost}
                  aria-label={tc("edit")}
                  title={tc("edit")}
                >
                  <Pencil className="size-4" />
                </button>

                <button
                  onClick={() => remove(s)}
                  className={btn.danger}
                  aria-label={tc("delete")}
                  title={tc("delete")}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Popup de confirmation */}
      <DeleteSponsorModal
        sponsor={deletingSponsor}
        onCancel={cancelRemove}
        onConfirm={confirmRemove}
        busy={deleting}
      />
    </div>
  );
}

export default function AdminSponsorsPage() {
  return (
    <RequireAuth roles={["admin"]}>
      {(user) => (
        <AppShell user={user}>
          <SponsorsAdmin />
        </AppShell>
      )}
    </RequireAuth>
  );
}

