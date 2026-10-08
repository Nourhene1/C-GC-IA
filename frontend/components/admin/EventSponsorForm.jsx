"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ImagePlus } from "lucide-react";
import Field from "@/components/ui/Field";
import Select from "@/components/ui/Select";
import { ErrorAlert } from "@/components/ui/Alert";
import { btn, card } from "@/components/ui/styles";
import { api, publicFileUrl } from "@/lib/api";
import { LOGO_ACCEPT, LOGO_MAX_MB } from "@/lib/constants";

const BASE = "/api/admin/event-sponsors";
const TIERS = ["titre", "or", "argent", "bronze"];

const EMPTY = {
  name: "",
  website: "",
  tier: "bronze",
  edition: "",
  order: 0,
  active: true,
};

export default function EventSponsorForm({ initial, editions = [], onCancel, onSaved }) {
  const t = useTranslations("adminEventSponsors");
  const tc = useTranslations("common");

  const fileInput = useRef(null);
  const isEdit = Boolean(initial?._id);

  const [form, setForm] = useState(
    initial
      ? {
          name: initial.name || "",
          website: initial.website || "",
          tier: initial.tier || "bronze",
          edition: initial.edition?._id || initial.edition || "",
          order: initial.order ?? 0,
          active: initial.active ?? true,
        }
      : EMPTY
  );
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  // Aperçu local du nouveau logo, libéré à chaque changement
  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const currentLogo = preview || (initial?.logo ? publicFileUrl(initial.logo) : null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
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

    if (!isEdit && !file) {
      setError("LOGO_REQUIRED");
      return;
    }

    setBusy(true);
    setError(null);

    const data = new FormData();
    ["name", "website", "tier", "edition", "order"].forEach((k) =>
      data.append(k, form[k] ?? "")
    );
    data.append("active", String(form.active));
    if (file) data.append("logo", file);

    try {
      await api(isEdit ? `${BASE}/${initial._id}` : BASE, {
        method: isEdit ? "PUT" : "POST",
        body: data,
      });
      await onSaved();
    } catch (err) {
      setError(err);
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className={`${card} flex flex-col gap-4 border-2 border-accent/30`}
    >
      <h2 className="font-bold text-primary">{isEdit ? t("edit") : t("new")}</h2>

      <ErrorAlert error={error} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={t("name")}
          name="name"
          value={form.name}
          onChange={handleChange}
          required
          maxLength={120}
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
          options={TIERS.map((v) => ({ value: v, label: t(`tiers.${v}`) }))}
        />

        <Select
          label={t("edition")}
          name="edition"
          value={form.edition}
          onChange={handleChange}
          options={[
            { value: "", label: t("noEdition") },
            ...editions.map((ed) => ({ value: ed._id, label: `${ed.name} ${ed.year}` })),
          ]}
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

        <label className="flex cursor-pointer items-center gap-3 self-end rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-primary">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
            className="size-4 accent-accent"
          />
          {t("visible")}
        </label>
      </div>

      {/* Logo */}
      <div className="flex items-center gap-4">
        <div className="flex size-20 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white p-2">
          {currentLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={currentLogo} alt="" className="max-h-full max-w-full object-contain" />
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
            {isEdit ? `${t("logoKeep")} ` : ""}
            {t("logoHint", { max: LOGO_MAX_MB })}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} disabled={busy} className={btn.outline}>
          {tc("cancel")}
        </button>

        <button type="submit" disabled={busy} className={btn.primary}>
          {busy ? tc("saving") : tc("save")}
        </button>
      </div>
    </form>
  );
}