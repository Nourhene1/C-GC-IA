"use client";
import { useTranslations } from "next-intl";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";

const STYLES = {
  error:   { box: "bg-red-50 text-red-700 border-red-200", Icon: AlertCircle },
  success: { box: "bg-green-50 text-green-800 border-green-200", Icon: CheckCircle2 },
  info:    { box: "bg-accent-light text-ink border-accent/30", Icon: Info },
};

export function Alert({ type = "info", children, className = "" }) {
  const { box, Icon } = STYLES[type];
  return (
    <div role={type === "error" ? "alert" : "status"}
      className={`flex gap-3 rounded-xl border px-4 py-3 text-sm ${box} ${className}`}>
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

// Affiche le message traduit d'un code d'erreur renvoyé par l'API
export function ErrorAlert({ error, className = "" }) {
  const t = useTranslations("errors");
  if (!error) return null;
  const code = typeof error === "string" ? error : error.code;
  const params = typeof error === "string" ? {} : error.data?.params || {};
  return (
    <Alert type="error" className={className}>
      {t.has(code) ? t(code, params) : t("SERVER_ERROR")}
    </Alert>
  );
}
