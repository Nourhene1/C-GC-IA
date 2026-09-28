"use client";
import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations, useFormatter } from "next-intl";
import { Mail, Lock, User, UserPlus, ArrowRight, MailCheck, CalendarX } from "lucide-react";
import AuthInput from "@/components/auth/AuthInput";
import AuthBrandPanel from "@/components/auth/AuthBrandPanel";
import { Alert, ErrorAlert } from "@/components/ui/Alert";
import { api } from "@/lib/api";
import { useEdition } from "@/lib/useEdition";
import { DATE_LONG } from "@/lib/format";

// Écran affiché après l'inscription : "vérifiez votre boîte mail"
function EmailSent({ email }) {
  const t = useTranslations("register");
  const [resent, setResent] = useState(false);

  const resend = async () => {
    await api("/api/auth/resend-verification", { method: "POST", body: { email } }).catch(() => {});
    setResent(true);
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 px-8 py-16 text-center sm:px-12">
      <div className="rounded-full bg-accent-light p-4">
        <MailCheck className="size-10 text-accent" />
      </div>
      <h1 className="text-2xl font-bold text-primary">{t("sentTitle")}</h1>
      <p className="max-w-sm text-sm leading-relaxed text-slate-600">
        {t("sentText", { email })}
      </p>
      <p className="text-xs text-slate-500">{t("sentHint")}</p>
      {resent ? (
        <Alert type="success">{t("resent")}</Alert>
      ) : (
        <button onClick={resend} className="text-sm font-semibold text-accent underline underline-offset-2">
          {t("resend")}
        </button>
      )}
      <Link href="/login" className="mt-2 text-sm font-semibold text-primary hover:text-accent">
        {t("login")} →
      </Link>
    </div>
  );
}

export default function RegisterPage() {
  const t = useTranslations("register");
  const locale = useLocale();
  const format = useFormatter();
  const { edition, registrationOpen } = useEdition();

  const [form, setForm] = useState({ nom: "", prenom: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState(null);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (form.password !== form.confirm) return setError("PASSWORDS_MISMATCH");

    setLoading(true);
    try {
      const { confirm, ...body } = form;
      const data = await api("/api/auth/register", { method: "POST", body: { ...body, locale } });
      setSentTo(data.email);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid overflow-hidden rounded-3xl bg-white shadow-2xl shadow-primary/10 md:grid-cols-[45%_55%]">
      <AuthBrandPanel />

      {sentTo ? (
        <EmailSent email={sentTo} />
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col justify-center gap-5 px-8 py-12 sm:px-12">
          <div>
            <h1 className="flex items-center gap-3 text-3xl font-bold text-primary">
              <UserPlus className="size-8" strokeWidth={2.2} /> {t("title")}
            </h1>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-500">{t("subtitle")}</p>
          </div>

          {/* F2.5 : inscriptions fermées */}
          {edition && !registrationOpen && (
            <Alert type="info">
              <p className="flex items-center gap-2 font-semibold text-primary">
                <CalendarX className="size-4" /> {t("closedTitle")}
              </p>
              <p>
                {t("closedText", {
                  open: format.dateTime(new Date(edition.dates.registrationOpen), DATE_LONG),
                  close: format.dateTime(new Date(edition.dates.registrationClose), DATE_LONG),
                })}
              </p>
            </Alert>
          )}

          <ErrorAlert error={error} />

          <fieldset disabled={loading || (edition && !registrationOpen)} className="flex flex-col gap-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <AuthInput icon={User} name="nom" placeholder={t("lastName")}
                value={form.nom} onChange={handleChange} required autoComplete="family-name" />
              <AuthInput icon={User} name="prenom" placeholder={t("firstName")}
                value={form.prenom} onChange={handleChange} required autoComplete="given-name" />
            </div>
            <AuthInput icon={Mail} type="email" name="email" placeholder={t("email")}
              value={form.email} onChange={handleChange} required autoComplete="email" />
            <AuthInput icon={Lock} type="password" name="password" placeholder={t("password")}
              value={form.password} onChange={handleChange} required minLength={8} autoComplete="new-password" />
            <AuthInput icon={Lock} type="password" name="confirm" placeholder={t("confirmPassword")}
              value={form.confirm} onChange={handleChange} required minLength={8} autoComplete="new-password" />

            <button type="submit"
              className="flex items-center justify-center gap-2 rounded-xl bg-accent py-3.5 font-semibold text-white shadow-md shadow-accent/30 transition hover:bg-primary disabled:opacity-60">
              {loading ? t("submitting") : <>{t("submit")} <ArrowRight className="size-4" /></>}
            </button>
          </fieldset>

          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span className="h-px flex-1 bg-slate-200" /> {t("or")} <span className="h-px flex-1 bg-slate-200" />
          </div>

          <p className="text-center text-sm text-slate-600">
            {t("hasAccount")}{" "}
            <Link href="/login" className="font-semibold text-accent underline underline-offset-2">{t("login")}</Link>
          </p>
        </form>
      )}
    </div>
  );
}
