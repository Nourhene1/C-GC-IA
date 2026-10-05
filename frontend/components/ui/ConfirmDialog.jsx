"use client";
import { useEffect, useRef } from "react";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { btn } from "@/components/ui/styles";

// Fenêtre de confirmation aux couleurs du site (remplace window.confirm du navigateur).
// tone = "primary" (action importante) ou "danger" (suppression)
// confirmDisabled : bouton principal grisé (ex. motif pas encore saisi)
export default function ConfirmDialog({
  open, title, children, confirmLabel, cancelLabel, onConfirm, onCancel,
  busy = false, confirmDisabled = false, tone = "primary",
}) {
  const confirmRef = useRef(null);
  const cancelRef = useRef(onCancel);
  cancelRef.current = onCancel;

  // Focus sur le bouton principal à l'ouverture (une seule fois)
  useEffect(() => {
    if (open) confirmRef.current?.focus();
  }, [open]);

  // Fermeture avec la touche Échap
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && !busy && cancelRef.current();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy]);

  if (!open) return null;

  const danger = tone === "danger";
  const Icon = danger ? AlertTriangle : ShieldCheck;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 p-4 backdrop-blur-sm"
      onClick={() => !busy && onCancel()}>
      <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className={`h-1.5 ${danger ? "bg-red-500" : "bg-gradient-to-r from-primary to-accent"}`} />
        <div className="p-6">
          <div className="flex items-start gap-4">
            <span className={`flex size-11 shrink-0 items-center justify-center rounded-full ${danger ? "bg-red-50 text-red-600" : "bg-accent-light text-accent"}`}>
              <Icon className="size-6" />
            </span>
            <div className="min-w-0">
              <h2 id="confirm-title" className="text-lg font-bold text-primary">{title}</h2>
              <div className="mt-2 text-sm leading-relaxed text-slate-600">{children}</div>
            </div>
          </div>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={onCancel} disabled={busy} className={btn.outline}>{cancelLabel}</button>
            <button ref={confirmRef} type="button" onClick={onConfirm} disabled={busy || confirmDisabled}
              className={danger
                ? "inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                : btn.primary}>
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
