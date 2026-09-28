// Deux petits champs FR / EN côte à côte (pour les listes : titre d'un prix, rôle d'un juré…)
const input =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-4 focus:ring-accent/15";

export default function TextPair({ label, value = {}, onChange, required = false, multiline = false }) {
  const Input = multiline ? "textarea" : "input";
  return (
    <fieldset>
      <legend className="mb-1 text-xs font-semibold text-primary">
        {label}{required && <span className="text-accent"> *</span>}
      </legend>
      <div className="grid gap-2 sm:grid-cols-2">
        <Input className={input} rows={multiline ? 2 : undefined} placeholder="FR" aria-label={`${label} (FR)`}
          value={value.fr || ""} required={required} onChange={(e) => onChange({ ...value, fr: e.target.value })} />
        <Input className={input} rows={multiline ? 2 : undefined} placeholder="EN" aria-label={`${label} (EN)`}
          value={value.en || ""} onChange={(e) => onChange({ ...value, en: e.target.value })} />
      </div>
    </fieldset>
  );
}

export const smallInput = input;
