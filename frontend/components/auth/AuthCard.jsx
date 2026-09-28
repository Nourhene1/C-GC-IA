// Petite carte centrée pour les pages "confirmation", "activation"…
export default function AuthCard({ children }) {
  return (
    <div className="mx-auto w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl shadow-primary/10">
      <div className="h-2 bg-linear-to-r from-primary via-primary to-accent" />
      <div className="flex flex-col items-center gap-4 px-8 py-10 text-center sm:px-10">{children}</div>
    </div>
  );
}
