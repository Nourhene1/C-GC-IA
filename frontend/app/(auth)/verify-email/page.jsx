"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { CircleCheckBig, CircleX, LoaderCircle } from "lucide-react";
import AuthCard from "@/components/auth/AuthCard";
import { btn } from "@/components/ui/styles";
import { api } from "@/lib/api";
import { saveSession, homeFor } from "@/lib/auth";

function VerifyEmail() {
  const t = useTranslations("verify");
  const router = useRouter();
  const token = useSearchParams().get("token");
  const [state, setState] = useState("loading"); // loading | success | error
  const [next, setNext] = useState("/dashboard");
  const called = useRef(false);

  useEffect(() => {
    // En développement, React exécute les effets deux fois : le jeton ne
    // servant qu'une fois, le deuxième appel échouerait. On l'empêche.
    if (called.current) return;
    called.current = true;

    if (!token) return setState("error");

    api("/api/auth/verify-email", { method: "POST", body: { token } })
      .then(({ token: jwt, user }) => {
        saveSession(jwt, user);
        const target = homeFor(user);
        setNext(target);
        setState("success");
        setTimeout(() => router.push(target), 2500);
      })
      .catch(() => setState("error"));
  }, [token, router]);

  return (
    <AuthCard>
      {state === "loading" && (
        <>
          <LoaderCircle className="size-12 animate-spin text-accent" />
          <p className="text-slate-600">{t("loading")}</p>
        </>
      )}

      {state === "success" && (
        <>
          <CircleCheckBig className="size-14 text-green-600" />
          <h1 className="text-2xl font-bold text-primary">{t("successTitle")}</h1>
          <p className="text-sm text-slate-600">{t("successText")}</p>
          <Link href={next} className={btn.primary}>{t("continue")}</Link>
        </>
      )}

      {state === "error" && (
        <>
          <CircleX className="size-14 text-red-500" />
          <h1 className="text-2xl font-bold text-primary">{t("errorTitle")}</h1>
          <p className="text-sm text-slate-600">{t("errorText")}</p>
          <Link href="/login" className={btn.primary}>{t("toLogin")}</Link>
        </>
      )}
    </AuthCard>
  );
}

// useSearchParams doit être entouré d'un <Suspense> dans Next.js
export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmail />
    </Suspense>
  );
}
