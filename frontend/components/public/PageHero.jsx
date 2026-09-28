// Bandeau bleu en haut des pages publiques secondaires
export default function PageHero({ title, subtitle }) {
  return (
    <section className="relative overflow-hidden bg-primary text-white">
      <span aria-hidden className="absolute -right-16 top-6 h-4 w-72 -rotate-12 bg-accent/90" />
      <span aria-hidden className="absolute -right-10 top-14 h-1.5 w-60 -rotate-12 bg-white/20" />
      <div className="relative mx-auto max-w-6xl px-4 py-12">
        <h1 className="text-3xl font-extrabold sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-white/80">{subtitle}</p>}
      </div>
    </section>
  );
}
