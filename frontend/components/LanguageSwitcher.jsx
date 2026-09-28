"use client";
import { useTransition } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";

const LANGS = ["fr", "en"];

export default function LanguageSwitcher({ className = "" }) {
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const changeLanguage = (lang) => {
    document.cookie = `NEXT_LOCALE=${lang}; path=/; max-age=31536000; SameSite=Lax`;
    startTransition(() => router.refresh());
  };

  return (
    <div className={`inline-flex rounded-full bg-white p-1 shadow-md ${className}`}>
      {LANGS.map((lang) => (
        <button
          key={lang}
          onClick={() => changeLanguage(lang)}
          disabled={pending}
          aria-pressed={locale === lang}
          className={`rounded-full px-3 py-1 text-xs font-bold uppercase transition ${
            locale === lang ? "bg-primary text-white" : "text-primary hover:bg-surface"
          }`}
        >
          {lang}
        </button>
      ))}
    </div>
  );
}
