// Classes Tailwind partagées, pour garder le même style partout
export const btn = {
  primary:
    "inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-accent/30 transition hover:bg-primary disabled:cursor-not-allowed disabled:opacity-50",
  secondary:
    "inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50",
  outline:
    "inline-flex items-center justify-center gap-2 rounded-xl border border-primary/30 px-4 py-2 text-sm font-semibold text-primary transition hover:border-primary hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-50",
  ghost:
    "inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-primary transition hover:bg-surface disabled:opacity-50",
  danger:
    "inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50",
};

export const card = "rounded-2xl bg-white p-6 shadow-lg shadow-primary/5 sm:p-8";
export const sectionTitle = "flex items-center gap-2 text-lg font-bold text-primary";
