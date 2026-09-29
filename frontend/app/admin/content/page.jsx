"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ScrollText, BadgeCheck, CalendarDays, Gavel, Contact, FileText, ExternalLink } from "lucide-react";
import RequireAuth from "@/components/auth/RequireAuth";
import AppShell from "@/components/layout/AppShell";
import Spinner from "@/components/ui/Spinner";
import { Alert, ErrorAlert } from "@/components/ui/Alert";
import { card } from "@/components/ui/styles";
import RulesTab from "@/components/admin/content/RulesTab";
import EligibilityTab from "@/components/admin/content/EligibilityTab";
import EventsTab from "@/components/admin/content/EventsTab";
import JuryTab from "@/components/admin/content/JuryTab";
import ContactsTab from "@/components/admin/content/ContactsTab";
import { api } from "@/lib/api";

// Chaque onglet correspond à une exigence du Module 3 et à une page publique
const TABS = [
  { key: "rules", Icon: ScrollText, Tab: RulesTab, page: "/reglement" },           // F3.1
  { key: "eligibility", Icon: BadgeCheck, Tab: EligibilityTab, page: "/eligibilite" }, // F3.5
  { key: "calendar", Icon: CalendarDays, Tab: EventsTab, page: "/calendrier" },    // F3.2
  { key: "jury", Icon: Gavel, Tab: JuryTab, page: "/jury" },                       // F3.6
  { key: "contacts", Icon: Contact, Tab: ContactsTab, page: "/contact" },          // F3.4
];

function ContentAdmin() {
  const t = useTranslations("adminContent");
  const [data, setData] = useState(null);
  const [tab, setTab] = useState("rules");
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api("/api/admin/content").then(setData).catch(setError);
  }, []);

  // Enregistre une partie du contenu (celle de l'onglet affiché)
  const save = async (partial) => {
    setError(null);
    setSaved(false);
    setSaving(true); // la traduction automatique peut prendre quelques secondes
    try {
      const res = await api("/api/admin/content", { method: "PUT", body: partial });
      setData((d) => ({ ...d, content: res.content }));
      setSaved(true);
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  };

  const changeTab = (key) => {
    setTab(key);
    setSaved(false);
    setError(null);
  };

  if (!data) return error ? <ErrorAlert error={error} /> : <Spinner />;

  const current = TABS.find((x) => x.key === tab);
  const { Tab } = current;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-primary">
          <FileText className="size-6 text-accent" /> {t("title")}
        </h1>
        <p className="mt-1 text-sm text-slate-500">{t("subtitle", { year: data.edition.year })}</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1" role="tablist">
        {TABS.map(({ key, Icon }) => (
          <button key={key} role="tab" aria-selected={tab === key} onClick={() => changeTab(key)}
            className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${
              tab === key ? "bg-primary text-white" : "bg-white text-primary hover:bg-accent-light"
            }`}>
            <Icon className="size-4" /> {t(`tabs.${key}`)}
          </button>
        ))}
      </div>

      <section className={card}>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-primary">{t(`tabs.${tab}`)}</h2>
          <a href={current.page} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-semibold text-accent hover:underline">
            <ExternalLink className="size-4" /> {t("viewPage")}
          </a>
        </div>
        <div className="mb-5 flex flex-col gap-3">
          <ErrorAlert error={error} />
          {saving && <Alert type="info">{t("saving")}</Alert>}
          {saved && <Alert type="success">{t("saved")}</Alert>}
        </div>
        {/* key : l'onglet repart des données enregistrées quand on change d'onglet */}
        <Tab key={tab} content={data.content} edition={data.edition} onSave={save} onError={setError}
          onContentChange={(patch) => setData((d) => ({ ...d, content: { ...d.content, ...patch } }))} />
      </section>
    </div>
  );
}

export default function AdminContentPage() {
  return (
    <RequireAuth roles={["admin"]}>
      {(user) => <AppShell user={user}><ContentAdmin /></AppShell>}
    </RequireAuth>
  );
}
