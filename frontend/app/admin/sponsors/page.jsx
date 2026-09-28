"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Handshake, Plus, Pencil, Trash2, ImagePlus, ExternalLink } from "lucide-react";
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
const EMPTY = { name: "", website: "", tier: "partenaire", order: 0 };

// Formulaire d'ajout / modification d'un partenaire (envoyé en multipart pour le logo)
function SponsorForm({ initial, onCancel, onSaved }) {
  const t = useTranslations("adminSponsors");
  const tp = useTranslations("partners");
  const tc = useTranslations("common");
  const fileInput = useRef(null);
  const [form, setForm] = useState(initial || EMPTY);
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const pickFile = (e) => {
    const f = e.target.files[0];
    if (f && f.size > LOGO_MAX_MB * 1024 * 1024) return setError("FILE_TOO_LARGE");
    setError(null);
    setFile(f || null);
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const data = new FormData();
    ["name", "website", "tier", "order"].forEach((k) => data.append(k, form[k] ?? ""));
    if (file) data.append("file", file);
    try {
      await api(initial?._id ? `/api/admin/sponsors/${initial._id}` : "/api/admin/sponsors", {
        method: initial?._id ? "PUT" : "POST",
        body: data,
      });
      await onSaved();
    } catch (err) {
      setError(err);
      setBusy(false);
    }
  };

  const preview = file ? URL.createObjectURL(file) : publicFileUrl(initial?.logo);

  return (
    <form onSubmit={submit} className={`${card} flex flex-col gap-4 border-2 border-accent/30`}>
      <h2 className="font-bold text-primary">{initial?._id ? t("edit") : t("new")}</h2>
      <ErrorAlert error={error} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("name")} name="name" value={form.name} onChange={handleChange} required maxLength={100} />
        <Field label={t("website")} name="website" type="url" placeholder="https://…" value={form.website} onChange={handleChange} />
        <Select label={t("tier")} name="tier" value={form.tier} onChange={handleChange}
          options={TIERS.map((v) => ({ value: v, label: tp(`tiers.${v}`) }))} />
        <Field label={t("order")} name="order" type="number" min={0} value={form.order} onChange={handleChange}
          hint={t("orderHint")} />
      </div>

      <div className="flex items-center gap-4">
        <div className="flex size-20 items-center justify-center rounded-xl border border-slate-200 bg-white p-2">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element -- aperçu local ou image de l'API
            <img src={preview} alt="" className="max-h-full max-w-full object-contain" />
          ) : (
            <ImagePlus className="size-6 text-slate-300" />
          )}
        </div>
        <input ref={fileInput} type="file" accept={LOGO_ACCEPT} className="hidden" onChange={pickFile} />
        <div>
          <button type="button" onClick={() => fileInput.current.click()} className={btn.outline}>
            <ImagePlus className="size-4" /> {t("chooseLogo")}
          </button>
          <p className="mt-1 text-xs text-slate-500">{t("logoHint", { max: LOGO_MAX_MB })}</p>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className={btn.outline}>{tc("cancel")}</button>
        <button type="submit" disabled={busy} className={btn.primary}>{busy ? tc("saving") : tc("save")}</button>
      </div>
    </form>
  );
}

function SponsorsAdmin() {
  const t = useTranslations("adminSponsors");
  const tp = useTranslations("partners");
  const tc = useTranslations("common");
  const [sponsors, setSponsors] = useState(null);
  const [editing, setEditing] = useState(null); // null | "new" | objet sponsor
  const [error, setError] = useState(null);

  const load = useCallback(() => api("/api/sponsors").then((d) => setSponsors(d.sponsors)).catch(setError), []);
  useEffect(() => {
    load();
  }, [load]);

  const saved = async () => {
    setEditing(null);
    await load();
  };

  const remove = async (s) => {
    if (!window.confirm(t("confirmDelete", { name: s.name }))) return;
    try {
      await api(`/api/admin/sponsors/${s._id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      setError(err);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-primary">
            <Handshake className="size-6 text-accent" /> {t("title")}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{t("subtitle")}</p>
        </div>
        {!editing && (
          <button onClick={() => setEditing("new")} className={btn.primary}><Plus className="size-4" /> {t("new")}</button>
        )}
      </div>

      <ErrorAlert error={error} />
      {editing && (
        <SponsorForm key={editing._id || "new"} initial={editing === "new" ? null : editing}
          onCancel={() => setEditing(null)} onSaved={saved} />
      )}

      {!sponsors ? <Spinner /> : sponsors.length === 0 ? (
        <p className={`${card} text-center text-slate-500`}>{t("empty")}</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sponsors.map((s) => (
            <li key={s._id} className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-md shadow-primary/5">
              <div className="flex size-16 shrink-0 items-center justify-center rounded-xl border border-slate-100 p-1.5">
                {s.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element -- image servie par l'API
                  <img src={publicFileUrl(s.logo)} alt={s.name} className="max-h-full max-w-full object-contain" />
                ) : (
                  <Handshake className="size-6 text-slate-300" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-primary">{s.name}</p>
                <p className="text-xs font-semibold text-accent">{tp(`tiers.${s.tier}`)}</p>
                {s.website && (
                  <a href={s.website} target="_blank" rel="noopener noreferrer"
                    className="inline-flex max-w-full items-center gap-1 truncate text-xs text-slate-500 hover:text-accent">
                    <ExternalLink className="size-3 shrink-0" /> <span className="truncate">{s.website}</span>
                  </a>
                )}
              </div>
              <div className="flex flex-col">
                <button onClick={() => setEditing(s)} className={btn.ghost} aria-label={tc("edit")} title={tc("edit")}>
                  <Pencil className="size-4" />
                </button>
                <button onClick={() => remove(s)} className={btn.danger} aria-label={tc("delete")} title={tc("delete")}>
                  <Trash2 className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function AdminSponsorsPage() {
  return (
    <RequireAuth roles={["admin"]}>
      {(user) => <AppShell user={user}><SponsorsAdmin /></AppShell>}
    </RequireAuth>
  );
}
