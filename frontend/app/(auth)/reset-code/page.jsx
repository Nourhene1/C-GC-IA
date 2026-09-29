"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  ArrowRight,
  KeyRound,
} from "lucide-react";
import AuthInput from "@/components/auth/AuthInput";
import AuthBrandPanel from "@/components/auth/AuthBrandPanel";
import { ErrorAlert } from "@/components/ui/Alert";
import { api } from "@/lib/api";

export default function ResetCodePage() {
  const t = useTranslations("resetCode");
  const router = useRouter();
  const searchParams = useSearchParams();

  const email = searchParams.get("email") || "";

  const [code, setCode] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError(null);
    setLoading(true);

    try {
      const data = await api("/api/auth/verify-reset-code", {
        method: "POST",
        body: {
          email,
          code,
        },
      });

      // Le jeton n'apparaît pas dans l'URL : on le garde en session
      sessionStorage.setItem("resetEmail", email);
      sessionStorage.setItem("resetToken", data.resetToken);

      router.push("/new-password");
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid overflow-hidden rounded-3xl bg-white shadow-2xl shadow-primary/10 md:grid-cols-[55%_45%]">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col justify-center gap-5 px-8 py-12 sm:px-12"
      >
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold text-primary">
            <KeyRound className="size-8" strokeWidth={2.2} />
            {t("title")}
          </h1>

          <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-500">
            {t("subtitle")}
          </p>
        </div>

        {error && <ErrorAlert error={error} />}

        <AuthInput
          icon={KeyRound}
          type="text"
          name="code"
          placeholder={t("code")}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
          inputMode="numeric"
          maxLength={6}
          autoComplete="one-time-code"
        />

        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-xl bg-accent py-3.5 font-semibold text-white shadow-md shadow-accent/30 transition hover:bg-primary disabled:opacity-60"
        >
          {loading ? (
            t("submitting")
          ) : (
            <>
              {t("submit")}
              <ArrowRight className="size-4" />
            </>
          )}
        </button>

        <div className="text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-semibold text-accent underline underline-offset-2 hover:text-primary"
          >
            <ArrowLeft className="size-4" />
            {t("backToLogin")}
          </Link>
        </div>
      </form>

      <AuthBrandPanel />
    </div>
  );
}