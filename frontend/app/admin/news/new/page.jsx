"use client";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import RequireAuth from "@/components/auth/RequireAuth";
import AppShell from "@/components/layout/AppShell";
import NewsForm from "@/components/admin/NewsForm";

export default function NewNewsPage() {
  const t = useTranslations("adminNews");
  return (
    <RequireAuth roles={["admin"]}>
      {(user) => (
        <AppShell user={user}>
          <Link href="/admin/news" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-accent">
            <ArrowLeft className="size-4" /> {t("back")}
          </Link>
          <h1 className="mb-6 mt-4 text-2xl font-bold text-primary">{t("new")}</h1>
          <NewsForm />
        </AppShell>
      )}
    </RequireAuth>
  );
}
