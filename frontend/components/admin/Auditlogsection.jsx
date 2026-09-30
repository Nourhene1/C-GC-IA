"use client";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Download, RefreshCw } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import Spinner from "@/components/ui/Spinner";
import { ErrorAlert } from "@/components/ui/Alert";
import { btn, card, sectionTitle } from "@/components/ui/styles";
import { getSubjectAudit, exportSubjectAudit } from "@/lib/subject";

const ACTIONS = [
  "SUBJECT_VIEW",
  "SUBJECT_DOWNLOAD",
  "SUBJECT_ZIP_DOWNLOAD",
  "SUBJECT_FILE_UPLOAD",
  "SUBJECT_FILE_DELETE",
  "SUBJECT_SESSION_OPEN_CHANGED",
  "ADDENDUM_CREATE",
  "ADDENDUM_UPDATE",
  "AUDIT_EXPORT",
];

// Couleur du badge selon la nature de l'action
const badgeClass = (action) => {
  if (action.includes("DELETE")) return "bg-red-50 text-red-700";
  if (action.includes("UPLOAD") || action.includes("CREATE")) return "bg-emerald-50 text-emerald-700";
  if (action.includes("UPDATE") || action.includes("CHANGED")) return "bg-amber-50 text-amber-700";
  return "bg-slate-100 text-slate-700";
};

const inputClass =
  "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none";

export default function AuditLogSection() {
  const t = useTranslations("subject");
  const tc = useTranslations("common");
  const locale = useLocale();

  const [filters, setFilters] = useState({ action: "", from: "", to: "" });
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ logs: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(null); // "csv" | "pdf" | null

  // datetime-local -> ISO, valide pour new Date() côté serveur
  const apiFilters = useCallback(
    () => ({
      action: filters.action,
      from: filters.from ? new Date(filters.from).toISOString() : "",
      to: filters.to ? new Date(filters.to).toISOString() : "",
    }),
    [filters]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getSubjectAudit({ page, limit: 20, ...apiFilters() });
      setData(res);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [page, apiFilters]);

  useEffect(() => {
    load();
  }, [load]);

  // Télécharge le journal (avec les filtres actifs, toutes pages confondues)
  const handleExport = async (format) => {
    setExporting(format);
    setError(null);
    try {
      const blob = await exportSubjectAudit({ format, lang: locale, ...apiFilters() });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-sujet-${new Date().toISOString().slice(0, 10)}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      load(); // l'export est lui-même journalisé (AUDIT_EXPORT)
    } catch (err) {
      setError(err);
    } finally {
      setExporting(null);
    }
  };

  const updateFilter = (key) => (e) => {
    setFilters((f) => ({ ...f, [key]: e.target.value }));
    setPage(1);
  };

  const fmtDate = (d) =>
    new Date(d).toLocaleString(locale, { dateStyle: "short", timeStyle: "medium" });

  // Détail lisible selon les métadonnées enregistrées
  const detail = (log) => {
    const m = log.meta || {};
    if (m.originalName) return m.kind ? `${m.originalName} (${m.kind})` : m.originalName;
    if (m.from && m.to) return `${fmtDate(m.from)} → ${fmtDate(m.to)}`;
    if (m.files != null) return t("admin.audit.filesCount", { count: m.files });
    if (m.version != null) return `v${m.version}`;
    if (m.format) return `${m.format.toUpperCase()} (${m.count ?? 0})`;
    return "—";
  };

  const actionLabel = (a) => (t.has(`admin.audit.actions.${a}`) ? t(`admin.audit.actions.${a}`) : a);

  return (
    <section className={card}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className={sectionTitle}>{t("admin.audit.title")}</h2>
          <p className="mt-1 text-sm text-slate-500">{t("admin.audit.description")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {["csv", "pdf"].map((format) => (
            <button
              key={format}
              type="button"
              onClick={() => handleExport(format)}
              disabled={!!exporting || !data.total}
              className={btn.outline}
            >
              <Download className={`size-4 ${exporting === format ? "animate-pulse" : ""}`} />
              {exporting === format ? t("admin.audit.export.loading") : t(`admin.audit.export.${format}`)}
            </button>
          ))}
          <button type="button" onClick={load} disabled={loading} className={btn.outline}>
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            {t("actions.refresh")}
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="mt-6 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
          {t("admin.audit.filters.action")}
          <select value={filters.action} onChange={updateFilter("action")} className={inputClass}>
            <option value="">{t("admin.audit.filters.allActions")}</option>
            {ACTIONS.map((a) => (
              <option key={a} value={a}>{actionLabel(a)}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
          {t("admin.audit.filters.from")}
          <input type="datetime-local" value={filters.from} onChange={updateFilter("from")} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
          {t("admin.audit.filters.to")}
          <input type="datetime-local" value={filters.to} onChange={updateFilter("to")} className={inputClass} />
        </label>
        {(filters.action || filters.from || filters.to) && (
          <button
            type="button"
            className={btn.outline}
            onClick={() => { setFilters({ action: "", from: "", to: "" }); setPage(1); }}
          >
            {t("admin.audit.filters.reset")}
          </button>
        )}
      </div>

      <div className="mt-6">
        <ErrorAlert error={error} />

        {loading && !data.logs.length ? (
          <Spinner label={tc("loading")} />
        ) : !data.logs.length ? (
          <div className="rounded-xl border border-dashed border-slate-300 px-6 py-8 text-center text-sm text-slate-500">
            {t("admin.audit.empty")}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-500">
                <tr>
                  <th className="px-4 py-3">{t("admin.audit.columns.date")}</th>
                  <th className="px-4 py-3">{t("admin.audit.columns.user")}</th>
                  <th className="px-4 py-3">{t("admin.audit.columns.team")}</th>
                  <th className="px-4 py-3">{t("admin.audit.columns.action")}</th>
                  <th className="px-4 py-3">{t("admin.audit.columns.detail")}</th>
                  <th className="px-4 py-3">{t("admin.audit.columns.ip")}</th>
                </tr>
              </thead>
              <tbody className={`divide-y divide-slate-100 ${loading ? "opacity-60" : ""}`}>
                {data.logs.map((log) => (
                  <tr key={log._id}>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{fmtDate(log.at)}</td>
                    <td className="px-4 py-3">
                      {log.user ? (
                        <>
                          <div className="font-medium text-slate-800">
                            {log.user.prenom} {log.user.nom}
                          </div>
                          <div className="text-xs text-slate-500">{log.user.role || log.role}</div>
                        </>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{log.team?.name || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClass(log.action)}`}>
                        {actionLabel(log.action)}
                      </span>
                    </td>
                    <td className="max-w-xs truncate px-4 py-3 text-slate-600" title={detail(log)}>
                      {detail(log)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">{log.ip || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {data.total > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
            <span>{t("admin.audit.total", { count: data.total })}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className={btn.outline}
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => p - 1)}
                aria-label={t("admin.audit.prev")}
              >
                <ChevronLeft className="size-4" />
              </button>
              <span>{page} / {data.pages}</span>
              <button
                type="button"
                className={btn.outline}
                disabled={page >= data.pages || loading}
                onClick={() => setPage((p) => p + 1)}
                aria-label={t("admin.audit.next")}
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}