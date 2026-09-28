"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Lock, Mail, KeyRound, CircleX, ArrowRight, LoaderCircle } from "lucide-react";
import AuthCard from "@/components/auth/AuthCard";
import AuthInput from "@/components/auth/AuthInput";
import { ErrorAlert } from "@/components/ui/Alert";
import { btn } from "@/components/ui/styles";
import { api } from "@/lib/api";
import { saveSession } from "@/lib/auth";

function Activate() {
  const t = useTranslations("activate");
  const locale = useLocale();
  const router = useRouter();
  const token = useSearchParams().get("token");

  const [invitation, setInvitation] = useState(undefined); // undefined = chargement, null = invalide
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Récupère le prénom et le nom de l'équipe pour personnaliser la page
  useEffect(() => {
    if (!token) return setInvitation(null);
    api(`/api/auth/invitation/${token}`).then(setInvitation).catch(() => setInvitation(null));
  }, [token]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (form.password !== form.confirm) return setError("PASSWORDS_MISMATCH");

    setLoading(true);
    try {
      const { token: jwt, user } = await api("/api/auth/activate", {
        method: "POST",
        body: { token, password: form.password, locale },
      });
      saveSession(jwt, user);
      router.push("/team");
    } catch (err) {
      setError(err);
      setLoading(false);
    }
  };

  if (invitation === undefined) {
    return <AuthCard><LoaderCircle className="size-12 animate-spin text-accent" /></AuthCard>;
  }

  if (invitation === null) {
    return (
      <AuthCard>
        <CircleX className="size-14 text-red-500" />
        <h1 className="text-2xl font-bold text-primary">{t("errorTitle")}</h1>
        <p className="text-sm text-slate-600">{t("errorText")}</p>
        <Link href="/login" className={btn.primary}>{t("toLogin")}</Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <div className="rounded-full bg-accent-light p-4">
        <KeyRound className="size-9 text-accent" />
      </div>
      <h1 className="text-2xl font-bold text-primary">{t("title")}</h1>
      <p className="text-sm leading-relaxed text-slate-600">
        {t("subtitle", { name: invitation.prenom, team: invitation.teamName })}
      </p>

      <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4 text-left">
        <ErrorAlert error={error} />
        <AuthInput icon={Mail} type="email" value={invitation.email} disabled aria-label={t("email")} />
        <AuthInput icon={Lock} type="password" name="password" placeholder={t("password")}
          value={form.password} onChange={handleChange} required minLength={8} autoComplete="new-password" />
        <AuthInput icon={Lock} type="password" name="confirm" placeholder={t("confirmPassword")}
          value={form.confirm} onChange={handleChange} required minLength={8} autoComplete="new-password" />
        <button type="submit" disabled={loading} className={`${btn.primary} py-3.5`}>
          {loading ? t("submitting") : <>{t("submit")} <ArrowRight className="size-4" /></>}
        </button>
      </form>
    </AuthCard>
  );
}

export default function ActivatePage() {
  return (
    <Suspense>
      <Activate />
    </Suspense>
  );
}
