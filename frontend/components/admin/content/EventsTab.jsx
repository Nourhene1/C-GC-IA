"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Info } from "lucide-react";
import Link from "next/link";
import { btn } from "@/components/ui/styles";
import { toDateTimeInput, fromDateTimeInput } from "@/lib/content";
import RepeatableList from "./RepeatableList";
import TextPair, { smallInput } from "./TextPair";

// F3.2 : événements ajoutés au calendrier (en plus des dates de l'édition)
export default function EventsTab({ content, edition, onSave }) {
  const t = useTranslations("adminContent");
  const [events, setEvents] = useState(
    (content.events || []).map((e) => ({ ...e, start: toDateTimeInput(e.start), end: toDateTimeInput(e.end) }))
  );

  const save = () =>
    onSave({
      events: events.map((e) => ({ ...e, start: fromDateTimeInput(e.start), end: fromDateTimeInput(e.end) })),
    });

  return (
    <form onSubmit={(e) => { e.preventDefault(); save(); }} className="flex flex-col gap-6">
      <p className="flex gap-2 rounded-xl bg-accent-light/60 p-3 text-sm text-ink">
        <Info className="mt-0.5 size-4 shrink-0 text-accent" />
        <span>
          {t("eventsHint")}{" "}
          <Link href={`/admin/editions/${edition._id}`} className="font-semibold text-accent underline">{t("editDates")}</Link>
        </span>
      </p>
      <RepeatableList
        items={events}
        onChange={setEvents}
        addLabel={t("addEvent")}
        newItem={() => ({ title: { fr: "", en: "" }, description: { fr: "", en: "" }, start: "", end: "" })}
        renderItem={(e, update) => (
          <div className="flex flex-col gap-3">
            <TextPair label={t("eventTitle")} value={e.title} onChange={(title) => update({ title })} required />
            <TextPair label={t("eventDescription")} value={e.description} onChange={(description) => update({ description })} multiline />
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="text-xs font-semibold text-primary">
                {t("start")} <span className="text-accent">*</span>
                <input type="datetime-local" className={`${smallInput} mt-1`} required
                  value={e.start} onChange={(ev) => update({ start: ev.target.value })} />
              </label>
              <label className="text-xs font-semibold text-primary">
                {t("end")}
                <input type="datetime-local" className={`${smallInput} mt-1`}
                  value={e.end} onChange={(ev) => update({ end: ev.target.value })} />
              </label>
            </div>
          </div>
        )}
      />
      <button type="submit" className={`${btn.primary} self-end`}>{t("save")}</button>
    </form>
  );
}
