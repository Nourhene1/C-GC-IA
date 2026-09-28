"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import RequireAuth from "@/components/auth/RequireAuth";
import AppShell from "@/components/layout/AppShell";
import NewsForm from "@/components/admin/NewsForm";
import Spinner from "@/components/ui/Spinner";
import { ErrorAlert } from "@/components/ui/Alert";
import { api } from "@/lib/api";

function EditNews() {
  const t = useTranslations("adminNews");
  const { id } = useParams();
  const [news, setNews] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api(`/api/admin/news/${id}`).then((d) => setNews(d.news)).catch(setError);
  }, [id]);

  return (
    <>
      <Link href="/admin/news" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-accent">
        <ArrowLeft className="size-4" /> {t("back")}
      </Link>
      <h1 className="mb-6 mt-4 text-2xl font-bold text-primary">{t("edit")}</h1>
      {error ? <ErrorAlert error={error} /> : !news ? <Spinner /> : <NewsForm initial={news} />}
    </>
  );
}

export default function EditNewsPage() {
  return (
    <RequireAuth roles={["admin"]}>
      {(user) => <AppShell user={user}><EditNews /></AppShell>}
    </RequireAuth>
  );
}
