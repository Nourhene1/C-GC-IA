import Image from "next/image";
import { useTranslations } from "next-intl";

function Curve({ className }) {
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden>
      <path d="M0 45 C 20 20, 35 8, 60 0" fill="none" stroke="#E87722" strokeWidth="12" strokeLinecap="round" />
      <path d="M0 70 C 25 40, 50 20, 85 0" fill="none" stroke="#2B5A8F" strokeWidth="5" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

export default function AuthBrandPanel() {
  const t = useTranslations("common");

  return (
    <div className="relative hidden flex-col items-center justify-center gap-4 overflow-hidden bg-primary px-10 py-12 text-center text-white md:flex">
      <Curve className="absolute -left-2 -top-2 size-32" />
      <Curve className="absolute -bottom-2 -right-2 size-32 rotate-180" />

      <div className="rounded-full bg-white p-1.5 shadow-xl shadow-black/30 ring-4 ring-white/10">
        <Image src="/logo.png" alt={t("logoAlt")} width={230} height={230} priority className="rounded-full" />
      </div>

      <h2 className="mt-2 font-extrabold uppercase leading-tight tracking-wide">
        <span className="block text-3xl">{t("competition")}</span>
        <span className="block text-2xl">
          ISET Sfax <span className="text-accent">2027</span>
        </span>
      </h2>
      <span className="h-1 w-12 rounded-full bg-accent" />
      <p className="text-sm text-white/90">{t("tagline")}</p>
    </div>
  );
}
