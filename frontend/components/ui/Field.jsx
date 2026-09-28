// Champ de formulaire avec libellé, icône facultative et aide
export default function Field({ label, icon: Icon, hint, className = "", ...props }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-semibold text-primary">
        {label}
        {props.required && <span className="text-accent"> *</span>}
      </span>
      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-primary/60" />
        )}
        <input
          className={`w-full rounded-xl border border-slate-200 bg-white py-3 pr-4 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-accent focus:ring-4 focus:ring-accent/15 disabled:bg-slate-50 disabled:text-slate-500 ${
            Icon ? "pl-12" : "pl-4"
          }`}
          {...props}
        />
      </div>
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}
