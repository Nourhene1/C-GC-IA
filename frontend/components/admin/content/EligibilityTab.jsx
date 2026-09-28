"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import BilingualField from "@/components/admin/BilingualField";
import { btn } from "@/components/ui/styles";
import RepeatableList from "./RepeatableList";
import TextPair from "./TextPair";

// F3.5 : critères d'éligibilité + prix et récompenses
export default function EligibilityTab({ content, onSave }) {
  const t = useTranslations("adminContent");
  const [eligibility, setEligibility] = useState(content.eligibility || { fr: "", en: "" });
  const [prizes, setPrizes] = useState(content.prizes || []);

  const save = () =>
    onSave({ eligibility, prizes: prizes.map((p, i) => ({ ...p, rank: i + 1 })) }); // le rang suit l'ordre de la liste

  return (
    <form onSubmit={(e) => { e.preventDefault(); save(); }} className="flex flex-col gap-6">
      <BilingualField label={t("eligibilityText")} value={eligibility} onChange={setEligibility} multiline />
      <p className="-mt-3 text-xs text-slate-500">{t("formatHint")}</p>

      <div>
        <p className="mb-3 text-sm font-semibold text-primary">{t("prizes")}</p>
        <RepeatableList
          items={prizes}
          onChange={setPrizes}
          addLabel={t("addPrize")}
          newItem={() => ({ title: { fr: "", en: "" }, reward: { fr: "", en: "" } })}
          renderItem={(p, update, i) => (
            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold uppercase text-accent">{t("rank", { rank: i + 1 })}</span>
              <TextPair label={t("prizeTitle")} value={p.title} onChange={(title) => update({ title })} required />
              <TextPair label={t("prizeReward")} value={p.reward} onChange={(reward) => update({ reward })} multiline />
            </div>
          )}
        />
      </div>

      <button type="submit" className={`${btn.primary} self-end`}>{t("save")}</button>
    </form>
  );
}
