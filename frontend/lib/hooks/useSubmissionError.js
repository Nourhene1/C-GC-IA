"use client";
import { useTranslations } from "next-intl";

// Transforme une erreur API ({ code, data }) en message traduit
export default function useSubmissionError() {
  const t = useTranslations("submission");
  return (err) => {
    const code = err?.code;
    if (code && t.has(`errors.${code}`)) {
      return t(`errors.${code}`, {
        maxMb: err.data?.maxMb ?? "",
        max: err.data?.max ?? "",
        allowed: (err.data?.allowed ?? []).join(", "),
      });
    }
    return t("errors.generic");
  };
}