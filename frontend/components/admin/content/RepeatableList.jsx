"use client";
import { useTranslations } from "next-intl";
import { Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { btn } from "@/components/ui/styles";

// Liste d'éléments éditables (prix, jury, contacts, événements) :
// ajouter, supprimer, monter / descendre. Le contenu de chaque carte est fourni par renderItem.
export default function RepeatableList({ items, onChange, newItem, renderItem, addLabel }) {
  const tc = useTranslations("common");
  const t = useTranslations("adminContent");

  const update = (i) => (patch) => onChange(items.map((it, j) => (j === i ? { ...it, ...patch } : it)));
  const remove = (i) => onChange(items.filter((_, j) => j !== i));
  const move = (i, dir) => {
    const next = [...items];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-3">
      {items.map((item, i) => (
        <div key={item._id || `new-${i}`} className="flex gap-3 rounded-2xl border border-slate-200 p-4">
          <div className="min-w-0 flex-1">{renderItem(item, update(i), i)}</div>
          <div className="flex flex-col gap-1">
            <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className={btn.ghost} aria-label={t("moveUp")}>
              <ArrowUp className="size-4" />
            </button>
            <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} className={btn.ghost} aria-label={t("moveDown")}>
              <ArrowDown className="size-4" />
            </button>
            <button type="button" onClick={() => remove(i)} className={btn.danger} aria-label={tc("delete")}>
              <Trash2 className="size-4" />
            </button>
          </div>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...items, newItem()])} className={`${btn.outline} w-fit`}>
        <Plus className="size-4" /> {addLabel}
      </button>
    </div>
  );
}
