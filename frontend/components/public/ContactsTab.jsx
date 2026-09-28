"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { btn } from "@/components/ui/styles";
import RepeatableList from "./RepeatableList";
import TextPair, { smallInput } from "./TextPair";

// F3.4 : référents affichés sur la page Contact
export default function ContactsTab({ content, onSave }) {
  const t = useTranslations("adminContent");
  const [contacts, setContacts] = useState(content.contacts || []);

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave({ contacts }); }} className="flex flex-col gap-6">
      <p className="text-sm text-slate-500">{t("contactsHint")}</p>
      <RepeatableList
        items={contacts}
        onChange={setContacts}
        addLabel={t("addContact")}
        newItem={() => ({ name: "", role: { fr: "", en: "" }, email: "", phone: "" })}
        renderItem={(c, update) => (
          <div className="flex flex-col gap-3">
            <input className={smallInput} placeholder={t("name")} aria-label={t("name")} required
              value={c.name} onChange={(e) => update({ name: e.target.value })} />
            <TextPair label={t("role")} value={c.role} onChange={(role) => update({ role })} />
            <div className="grid gap-2 sm:grid-cols-2">
              <input className={smallInput} type="email" placeholder={t("email")} aria-label={t("email")}
                value={c.email} onChange={(e) => update({ email: e.target.value })} />
              <input className={smallInput} type="tel" placeholder={t("phone")} aria-label={t("phone")}
                value={c.phone} onChange={(e) => update({ phone: e.target.value })} />
            </div>
          </div>
        )}
      />
      <button type="submit" className={`${btn.primary} self-end`}>{t("save")}</button>
    </form>
  );
}
