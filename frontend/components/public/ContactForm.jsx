"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Send, CircleCheckBig } from "lucide-react";
import Field from "@/components/ui/Field";
import TextArea from "@/components/ui/TextArea";
import { ErrorAlert } from "@/components/ui/Alert";
import { btn } from "@/components/ui/styles";
import { api } from "@/lib/api";

const EMPTY = { name: "", email: "", subject: "", message: "", website: "" };

// F3.4 : formulaire de contact adressé à l'organisation
export default function ContactForm() {
  const t = useTranslations("contact");
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api("/api/contact", { method: "POST", body: form });
      setSent(true);
      setForm(EMPTY);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <CircleCheckBig className="size-14 text-green-600" />
        <p className="text-xl font-bold text-primary">{t("sentTitle")}</p>
        <p className="text-slate-600">{t("sentText")}</p>
        <button onClick={() => setSent(false)} className={`${btn.outline} mt-2`}>{t("another")}</button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <ErrorAlert error={error} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={t("name")} name="name" value={form.name} onChange={handleChange} required maxLength={100} autoComplete="name" />
        <Field label={t("email")} type="email" name="email" value={form.email} onChange={handleChange} required maxLength={150} autoComplete="email" />
      </div>
      <Field label={t("subject")} name="subject" value={form.subject} onChange={handleChange} required maxLength={150} />
      <TextArea label={t("message")} name="message" rows={6} value={form.message} onChange={handleChange} required maxLength={5000} />

      {/* Champ piège anti-robots : invisible et ignoré par les humains */}
      <div aria-hidden="true" className="absolute -left-[9999px]">
        <label>Website <input name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={handleChange} /></label>
      </div>

      <button type="submit" disabled={busy} className={`${btn.primary} self-end px-8 py-3`}>
        <Send className="size-4" /> {busy ? t("sending") : t("send")}
      </button>
    </form>
  );
}
