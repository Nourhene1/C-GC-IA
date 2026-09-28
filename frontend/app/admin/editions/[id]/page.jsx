"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import RequireAuth from "@/components/auth/RequireAuth";
import AppShell from "@/components/layout/AppShell";
import EditionForm from "@/components/admin/EditionForm";
import Spinner from "@/components/ui/Spinner";
import { ErrorAlert } from "@/components/ui/Alert";
import { api } from "@/lib/api";

// /admin/editions/new -> création ; /admin/editions/<id> -> modification
function EditEdition() {
  const t = useTranslations("adminEditions");
  const { id } = useParams();
  const isNew = id === "new";
  const [edition, setEdition] = useState(isNew ? {} : null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isNew) api(`/api/admin/editions/${id}`).then((d) => setEdition(d.edition)).catch(setError);
  }, [id, isNew]);

  return (
    <>
      <Link href="/admin/editions" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-accent">
        <ArrowLeft className="size-4" /> {t("back")}
      </Link>
      <h1 className="mb-6 mt-4 text-2xl font-bold text-primary">
        {isNew ? t("new") : edition ? t("editTitle", { year: edition.year }) : ""}
      </h1>
      {error ? <ErrorAlert error={error} /> : !edition ? <Spinner /> : (
        <EditionForm key={edition._id || "new"} initial={isNew ? null : edition} />
      )}
    </>
  );
}

export default function EditionPage() {
  return (
    <RequireAuth roles={["admin"]}>
      {(user) => <AppShell user={user}><EditEdition /></AppShell>}
    </RequireAuth>
  );
}
