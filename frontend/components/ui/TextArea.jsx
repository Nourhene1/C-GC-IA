export default function TextArea({ label, className = "", ...props }) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="mb-1.5 block text-sm font-semibold text-primary">{label}</span>}
      <textarea
        rows={3}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-accent focus:ring-4 focus:ring-accent/15"
        {...props}
      />
    </label>
  );
}
