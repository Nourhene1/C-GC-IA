"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Mail, Lock, UserRoundCheck, ArrowRight } from "lucide-react";
import AuthInput from "@/components/auth/AuthInput";
import AuthBrandPanel from "@/components/auth/AuthBrandPanel";
import { Alert, ErrorAlert } from "@/components/ui/Alert";
import { api } from "@/lib/api";
import { saveSession, homeFor } from "@/lib/auth";

export default function LoginPage() {
  const t = useTranslations("login");
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState(null);
  const [resent, setResent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setResent(false);
    setLoading(true);
    try {
      const { token, user } = await api("/api/auth/login", { method: "POST", body: form });
      saveSession(token, user, remember);
      router.push(homeFor(user));
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // Compte pas encore confirmé : on propose de renvoyer l'email (F2.1)
  const resend = async () => {
    await api("/api/auth/resend-verification", { method: "POST", body: { email: form.email } }).catch(() => {});
    setError(null);
    setResent(true);
  };

  return (
    <div className="grid overflow-hidden rounded-3xl bg-white shadow-2xl shadow-primary/10 md:grid-cols-[55%_45%]">
      <form onSubmit={handleSubmit} className="flex flex-col justify-center gap-5 px-8 py-12 sm:px-12">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold text-primary">
            <UserRoundCheck className="size-8" strokeWidth={2.2} /> {t("title")}
          </h1>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-slate-500">{t("subtitle")}</p>
        </div>

        {error && (
          <div className="flex flex-col gap-2">
            <ErrorAlert error={error} />
            {error.code === "EMAIL_NOT_VERIFIED" && (
              <button type="button" onClick={resend}
                className="self-start text-sm font-semibold text-accent underline underline-offset-2">
                {t("resend")}
              </button>
            )}
          </div>
        )}
        {resent && <Alert type="success">{t("resent")}</Alert>}

        <AuthInput icon={Mail} type="email" name="email" placeholder={t("email")}
          value={form.email} onChange={handleChange} required autoComplete="email" />
        <AuthInput icon={Lock} type="password" name="password" placeholder={t("password")}
          value={form.password} onChange={handleChange} required autoComplete="current-password" />

        <div className="flex items-center justify-between gap-4 text-sm">
          <label className="flex cursor-pointer items-center gap-2 text-slate-600">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)}
              className="size-4 accent-accent" />
            {t("remember")}
          </label>
          <Link href="/forgot-password" className="text-accent hover:underline">{t("forgot")}</Link>
        </div>

        <button type="submit" disabled={loading}
          className="flex items-center justify-center gap-2 rounded-xl bg-accent py-3.5 font-semibold text-white shadow-md shadow-accent/30 transition hover:bg-primary disabled:opacity-60">
          {loading ? t("submitting") : <>{t("submit")} <ArrowRight className="size-4" /></>}
        </button>

        <p className="text-center text-sm text-slate-600">
          {t("noAccount")}{" "}
          <Link href="/register" className="font-semibold text-accent underline underline-offset-2">{t("register")}</Link>
        </p>
      </form>

      <AuthBrandPanel />
    </div>
  );
}
