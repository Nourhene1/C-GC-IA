import { getLocale, getTranslations, getFormatter } from "next-intl/server";
import { CircleCheck, CircleDot, Circle } from "lucide-react";
import PageHero from "@/components/public/PageHero";
import { serverApi } from "@/lib/server-api";
import { pick } from "@/lib/content";

export async function generateMetadata() {
  const t = await getTranslations("calendar");
  return { title: t("title") };
}

// F3.2 : calendrier détaillé de toutes les phases
export default async function CalendarPage() {
  const t = await getTranslations("calendar");
  const locale = await getLocale();
  const format = await getFormatter();
  const data = await serverApi("/api/content");

  if (!data) {
    return (
      <>
        <PageHero title={t("title")} />
        <p className="mx-auto max-w-3xl px-4 py-10 text-center text-slate-500">{t("empty")}</p>
      </>
    );
  }

  const d = data.edition.dates;
  const now = new Date(data.now);

  // Les phases officielles, construites à partir des dates de l'édition
  const phases = [
    { key: "registration", start: d.registrationOpen, end: d.registrationClose },
    { key: "session", start: d.sessionOpen },
    { key: "submission", start: d.sessionOpen, end: d.submissionDeadline },
    d.evaluationStart && { key: "evaluation", start: d.evaluationStart, end: d.evaluationEnd },
    d.resultsDate && { key: "results", start: d.resultsDate },
  ]
    .filter(Boolean)
    .map((p) => ({ ...p, title: t(`phases.${p.key}.title`), description: t(`phases.${p.key}.description`) }));

  // + les événements ajoutés par l'admin (séance d'information, cérémonie…)
  const events = (data.content.events || []).map((e) => ({
    key: e._id,
    start: e.start,
    end: e.end,
    title: pick(e.title, locale),
    description: pick(e.description, locale),
    extra: true,
  }));

  const items = [...phases, ...events].sort((a, b) => new Date(a.start) - new Date(b.start));

  const stateOf = (item) => {
    const start = new Date(item.start);
    const end = item.end ? new Date(item.end) : start;
    if (now > end) return "past";
    if (now >= start) return "current";
    return "upcoming";
  };

  const fmt = (date) => format.dateTime(new Date(date), { dateStyle: "long", timeStyle: "short" });

  return (
    <>
      <PageHero title={t("title")} subtitle={t("subtitle", { year: data.edition.year })} />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <ol className="relative flex flex-col gap-6 border-l-2 border-primary/15 pl-8">
          {items.map((item) => {
            const state = stateOf(item);
            const Icon = state === "past" ? CircleCheck : state === "current" ? CircleDot : Circle;
            return (
              <li key={item.key} className="relative">
                <span className={`absolute -left-[45px] top-5 flex size-7 items-center justify-center rounded-full bg-surface ${
                  state === "current" ? "text-accent" : state === "past" ? "text-green-600" : "text-primary/40"}`}>
                  <Icon className="size-7" />
                </span>
                <div className={`rounded-2xl p-5 ${
                  state === "current" ? "bg-white shadow-xl shadow-accent/10 ring-2 ring-accent"
                    : state === "past" ? "bg-white/60" : "bg-white shadow-lg shadow-primary/5"}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    {state === "current" && (
                      <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-bold text-white">{t("now")}</span>
                    )}
                    {item.extra && (
                      <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-800">{t("event")}</span>
                    )}
                    <time className="text-sm font-semibold text-accent">
                      {item.end ? t("range", { start: fmt(item.start), end: fmt(item.end) }) : fmt(item.start)}
                    </time>
                  </div>
                  <h2 className={`mt-2 text-lg font-bold ${state === "past" ? "text-slate-500" : "text-primary"}`}>{item.title}</h2>
                  {item.description && <p className="mt-1 text-sm text-slate-600">{item.description}</p>}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </>
  );
}
