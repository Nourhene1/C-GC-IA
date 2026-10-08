"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Handshake,
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  AlertTriangle,
  X,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
} from "lucide-react";

import RequireAuth from "@/components/auth/RequireAuth";
import AppShell from "@/components/layout/AppShell";
import EventSponsorForm from "@/components/admin/EventSponsorForm";
import Select from "@/components/ui/Select";
import Spinner from "@/components/ui/Spinner";
import { ErrorAlert } from "@/components/ui/Alert";
import { btn, card } from "@/components/ui/styles";
import { api, publicFileUrl } from "@/lib/api";

const BASE = "/api/admin/event-sponsors";
const JSON_HEADERS = { "Content-Type": "application/json" };
const TIERS = ["titre", "or", "argent", "bronze"];

const TIER_STYLES = {
  titre: "bg-primary text-white",
  or: "bg-amber-100 text-amber-800",
  argent: "bg-slate-200 text-slate-700",
  bronze: "bg-orange-100 text-orange-800",
};

function EventSponsorsAdmin() {
  const t = useTranslations("adminEventSponsors");
  const tc = useTranslations("common");

  const [sponsors, setSponsors] = useState(null);
  const [editions, setEditions] = useState([]);
  const [filters, setFilters] = useState({ edition: "", tier: "", active: "" });
  const [editing, setEditing] = useState(null); // null | "new" | sponsor
  const [deleting, setDeleting] = useState(null); // sponsor à supprimer
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  // Le réordonnancement n'a de sens que sur la liste complète
  const canReorder = !filters.edition && !filters.tier && !filters.active;

  const load = useCallback(() => {
    const qs = new URLSearchParams(
      Object.entries(filters).filter(([, v]) => v)
    ).toString();
    return api(`${BASE}${qs ? `?${qs}` : ""}`)
      .then((data) => setSponsors(Array.isArray(data) ? data : []))
      .catch(setError);
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    api("/api/editions")
      .then((d) => setEditions(Array.isArray(d) ? d : d?.editions || []))
      .catch(() => setEditions([]));
  }, []);

  const saved = async () => {
    setEditing(null);
    await load();
  };

  const toggle = async (sponsor) => {
    setError(null);
    try {
      const updated = await api(`${BASE}/${sponsor._id}/active`, {
        method: "PATCH",
        headers: JSON_HEADERS,
        body: JSON.stringify({ active: !sponsor.active }),
      });
      setSponsors((list) =>
        list.map((s) => (s._id === updated._id ? { ...s, active: updated.active } : s))
      );
    } catch (err) {
      setError(err);
    }
  };

  const move = async (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= sponsors.length) return;

    const next = [...sponsors];
    [next[index], next[target]] = [next[target], next[index]];
    const renumbered = next.map((s, i) => ({ ...s, order: i }));
    setSponsors(renumbered);

    try {
      await api(`${BASE}/reorder`, {
        method: "PATCH",
        headers: JSON_HEADERS,
        body: JSON.stringify({
          items: renumbered.map(({ _id, order }) => ({ id: _id, order })),
        }),
      });
    } catch (err) {
      setError(err);
      load();
    }
  };

  const confirmRemove = async () => {
    if (!deleting || busy) return;
    setBusy(true);
    setError(null);
    try {
      await api(`${BASE}/${deleting._id}`, { method: "DELETE" });
      setDeleting(null);
      await load();
    } catch (err) {
      setError(err);
      setDeleting(null);
    } finally {
      setBusy(false);
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
          <p className="mt-1 text-sm text-slate-500">{t("subtitle")}</p>
        </div>

        {!editing && (
          <button onClick={() => setEditing("new")} className={btn.primary}>
            <Plus className="size-4" />
            {t("new")}
          </button>
        )}
      </div>

      <ErrorAlert error={error} />

      {/* Filtres */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Select
          label={t("filterEdition")}
          name="edition"
          value={filters.edition}
          onChange={(e) => setFilters((f) => ({ ...f, edition: e.target.value }))}
          options={[
            { value: "", label: t("allEditions") },
            ...editions.map((ed) => ({ value: ed._id, label: `${ed.name} ${ed.year}` })),
          ]}
        />

        <Select
          label={t("filterTier")}
          name="tier"
          value={filters.tier}
          onChange={(e) => setFilters((f) => ({ ...f, tier: e.target.value }))}
          options={[
            { value: "", label: t("allTiers") },
            ...TIERS.map((v) => ({ value: v, label: t(`tiers.${v}`) })),
          ]}
        />

        <Select
          label={t("filterStatus")}
          name="active"
          value={filters.active}
          onChange={(e) => setFilters((f) => ({ ...f, active: e.target.value }))}
          options={[
            { value: "", label: t("allStatus") },
            { value: "true", label: t("visibleOnly") },
            { value: "false", label: t("hiddenOnly") },
          ]}
        />
      </div>

      {/* Formulaire */}
      {editing && (
        <EventSponsorForm
          key={editing === "new" ? "new" : editing._id}
          initial={editing === "new" ? null : editing}
          editions={editions}
          onCancel={() => setEditing(null)}
          onSaved={saved}
        />
      )}

      {/* Liste */}
      {!sponsors ? (
        <Spinner />
      ) : sponsors.length === 0 ? (
        <p className={`${card} text-center text-slate-500`}>{t("empty")}</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sponsors.map((s, i) => (
            <li
              key={s._id}
              className={`flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-md shadow-primary/5 ${
                s.active ? "" : "opacity-60"
              }`}
            >
              <div className="flex items-center gap-4">
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
                  <p className="truncate font-bold text-primary">{s.name}</p>

                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${TIER_STYLES[s.tier]}`}
                    >
                      {t(`tiers.${s.tier}`)}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        s.active ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {s.active ? t("visible") : t("hidden")}
                    </span>
                  </div>

                  {s.edition && (
                    <p className="mt-1 truncate text-xs text-slate-500">
                      {s.edition.name} {s.edition.year}
                    </p>
                  )}

                  {s.website && (
                    <a
                      href={s.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex max-w-full items-center gap-1 text-xs text-slate-500 hover:text-accent"
                    >
                      <ExternalLink className="size-3 shrink-0" />
                      <span className="truncate">{s.website}</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => move(i, -1)}
                    disabled={!canReorder || i === 0}
                    title={canReorder ? t("moveUp") : t("reorderDisabled")}
                    aria-label={t("moveUp")}
                    className={`${btn.ghost} disabled:opacity-30`}
                  >
                    <ArrowUp className="size-4" />
                  </button>
                  <button
                    onClick={() => move(i, 1)}
                    disabled={!canReorder || i === sponsors.length - 1}
                    title={canReorder ? t("moveDown") : t("reorderDisabled")}
                    aria-label={t("moveDown")}
                    className={`${btn.ghost} disabled:opacity-30`}
                  >
                    <ArrowDown className="size-4" />
                  </button>
                  <span className="ml-1 text-xs text-slate-400">#{s.order}</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggle(s)}
                    title={t("toggleVisibility")}
                    aria-label={t("toggleVisibility")}
                    className={btn.ghost}
                  >
                    {s.active ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                  </button>

                  <button
                    onClick={() => setEditing(s)}
                    aria-label={tc("edit")}
                    title={tc("edit")}
                    className={btn.ghost}
                  >
                    <Pencil className="size-4" />
                  </button>

                  <button
                    onClick={() => setDeleting(s)}
                    aria-label={tc("delete")}
                    title={tc("delete")}
                    className={btn.danger}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Popup de suppression */}
      {deleting && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !busy) setDeleting(null);
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-event-sponsor-title"
            className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setDeleting(null)}
              disabled={busy}
              aria-label={tc("cancel")}
              className="absolute right-4 top-4 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
            >
              <X className="size-5" />
            </button>

            <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-red-50">
              <AlertTriangle className="size-6 text-red-600" />
            </div>

            <h2 id="delete-event-sponsor-title" className="text-xl font-bold text-primary">
              {t("confirmDeleteTitle")}
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              {t("confirmDelete", { name: deleting.name })}
            </p>

            <div className="mt-4 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white p-1">
                {deleting.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={publicFileUrl(deleting.logo)}
                    alt=""
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <Handshake className="size-5 text-slate-300" />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-700">{deleting.name}</p>
                <p className="text-xs text-slate-500">{t(`tiers.${deleting.tier}`)}</p>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setDeleting(null)}
                disabled={busy}
                className={`${btn.outline} justify-center`}
              >
                {tc("cancel")}
              </button>

              <button
                type="button"
                onClick={confirmRemove}
                disabled={busy}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? <Spinner /> : <Trash2 className="size-4" />}
                {t("confirmDeleteButton")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminEventSponsorsPage() {
  return (
    <RequireAuth roles={["admin"]}>
      {(user) => (
        <AppShell user={user}>
          <EventSponsorsAdmin />
        </AppShell>
      )}
    </RequireAuth>
  );
}