import Link from "next/link";

const FEATURES = [
  { title: "Journal complet", text: "Chaque trade avec captures, notes, setup et émotions." },
  { title: "Import automatique", text: "MetaTrader 5, Binance et fichiers CSV, sans ressaisie." },
  { title: "Statistiques avancées", text: "Taux de réussite, R moyen, drawdown, performance par session." },
  { title: "Coach IA", text: "Un bilan hebdomadaire basé sur vos vraies erreurs." },
];

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-16">
      <nav className="mb-16 flex items-center justify-between">
        <span className="text-xl font-bold">
          Capital <span className="text-accent">Tracker</span>
        </span>
        <Link href="/connexion" className="text-sm text-muted hover:text-foreground">Se connecter</Link>
      </nav>
      <section className="text-center">
        <h1 className="text-4xl font-bold sm:text-5xl">Le journal de trading qui vous fait progresser</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted">
          Enregistrez vos trades, comprenez vos erreurs et améliorez votre discipline, jour après jour.
        </p>
        <Link
          href="/inscription"
          className="mt-8 inline-block rounded-lg bg-accent px-6 py-3 font-semibold text-black hover:opacity-90"
        >
          Commencer maintenant
        </Link>
      </section>
      <section className="mt-20 grid gap-4 sm:grid-cols-2">
        {FEATURES.map((f) => (
          <div key={f.title} className="rounded-xl border border-border bg-surface p-6">
            <h2 className="font-semibold">{f.title}</h2>
            <p className="mt-2 text-sm text-muted">{f.text}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
