import Link from "next/link";
import { Icons } from "@/components/icons";
import { PRICE_FCFA, formatFcfa } from "@/lib/billing";

const FEATURES = [
  { icon: Icons.journal, title: "Journal complet", text: "Chaque trade avec captures, notes, setup, émotions et respect du plan." },
  { icon: Icons.upload, title: "Import automatique", text: "MetaTrader 4/5 et fichiers CSV, sans rien ressaisir." },
  { icon: Icons.chart, title: "Statistiques avancées", text: "Taux de réussite, R moyen, drawdown, calendrier et performance par session." },
  { icon: Icons.news, title: "Calendrier économique", text: "Les annonces de la semaine, filtrées sur les devises que tu trades, avec compte à rebours." },
  { icon: Icons.bolt, title: "Analyseur de news IA", text: "Pour chaque annonce : ce qu'elle mesure, 3 scénarios, les paires touchées et un plan d'action." },
  { icon: Icons.coach, title: "Coach IA", text: "Un bilan hebdomadaire basé sur tes vraies erreurs, et des réponses à tes questions." },
];

const FAQ = [
  { q: "Combien coûte Capital Tracker ?", a: "7 jours d'essai gratuit, puis 2 500 FCFA par mois. Tu peux payer 3, 6 ou 12 mois d'un coup." },
  { q: "Comment je paie ?", a: "Par Mobile Money (MTN ou Orange). Ton abonnement est activé dès que le paiement est validé." },
  { q: "Mes données sont-elles privées ?", a: "Oui. Chaque trader ne voit que ses propres trades, protégés au niveau de la base de données." },
  { q: "Ça marche sur téléphone ?", a: "Oui, le site est pensé d'abord pour le mobile, avec une barre de navigation en bas de l'écran." },
];

function EquityCurve() {
  return (
    <svg viewBox="0 0 400 160" className="h-full w-full" aria-hidden>
      <defs>
        <linearGradient id="eq-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="eq-line" x1="0" x2="1">
          <stop offset="0%" stopColor="var(--color-accent)" />
          <stop offset="100%" stopColor="var(--color-accent-2)" />
        </linearGradient>
      </defs>
      <path
        d="M0 130 L30 120 L60 125 L90 100 L120 108 L150 85 L180 92 L210 70 L240 78 L270 55 L300 60 L330 38 L360 44 L400 20 L400 160 L0 160 Z"
        fill="url(#eq-fill)"
      />
      <path
        className="animate-draw"
        d="M0 130 L30 120 L60 125 L90 100 L120 108 L150 85 L180 92 L210 70 L240 78 L270 55 L300 60 L330 38 L360 44 L400 20"
        fill="none"
        stroke="url(#eq-line)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HeroPreview() {
  const stats = [
    { label: "Taux de réussite", value: "58 %" },
    { label: "R moyen", value: "+1,4R" },
    { label: "Drawdown max", value: "-3,2 %" },
  ];
  return (
    <div className="glass glow relative mx-auto mt-14 max-w-3xl rounded-3xl border border-white/10 p-5 text-left sm:p-6">
      <div className="flex items-center justify-between text-xs text-muted">
        <span>Courbe de capital · 30 jours</span>
        <span className="rounded-full bg-accent/15 px-2 py-0.5 font-semibold text-accent">+12,6 %</span>
      </div>
      <div className="mt-3 h-36 sm:h-44">
        <EquityCurve />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
            <p className="text-[11px] text-muted sm:text-xs">{s.label}</p>
            <p className="mt-1 font-semibold sm:text-lg">{s.value}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm">
        <span className="rounded-md bg-danger/20 px-2 py-0.5 text-xs font-semibold text-danger">Fort</span>
        <span className="min-w-0 flex-1 truncate">USD · Non-Farm Payrolls</span>
        <span className="font-mono text-xs text-amber-300">dans 02:14:09</span>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="relative overflow-x-hidden">
      <div className="bg-grid pointer-events-none absolute inset-x-0 top-0 h-[38rem]" aria-hidden />
      <main className="relative mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6">
        <nav className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-accent to-accent-2 text-black">
              <Icons.chart width={18} height={18} strokeWidth={2.4} />
            </span>
            <span>
              Capital <span className="text-gradient">Tracker</span>
            </span>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/demo" className="hidden text-muted hover:text-foreground sm:inline">
              Démo
            </Link>
            <Link href="/connexion" className="text-muted hover:text-foreground">
              Se connecter
            </Link>
          </div>
        </nav>

        <section className="animate-fade-up pt-16 text-center sm:pt-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
            <Icons.bolt width={14} height={14} /> Nouveau : calendrier économique + analyse IA des news
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
            Le journal de trading qui te fait <span className="text-gradient">vraiment progresser</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-muted sm:text-lg">
            Enregistre tes trades, prépare les annonces économiques et laisse l&apos;IA repérer tes erreurs. Tout au même endroit.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/inscription"
              className="w-full rounded-xl bg-gradient-to-r from-accent to-accent-2 px-6 py-3 font-semibold text-black shadow-lg shadow-accent/20 transition hover:opacity-90 sm:w-auto"
            >
              Essai gratuit 7 jours
            </Link>
            <Link
              href="/demo"
              className="w-full rounded-xl border border-white/10 px-6 py-3 font-semibold transition hover:border-accent/50 sm:w-auto"
            >
              Voir la démo
            </Link>
          </div>
          <HeroPreview />
        </section>

        <section className="mt-24">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">Tout ce qu&apos;il faut pour trader avec méthode</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="glass glow rounded-2xl border border-white/5 p-6 transition hover:border-accent/30">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent/10 text-accent">
                  <f.icon width={20} height={20} />
                </span>
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted">{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-24 grid items-center gap-8 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">Un prix simple</h2>
            <p className="mt-3 text-muted">
              Commence gratuitement pendant 7 jours. Ensuite, un seul abonnement donne accès à tout, coach IA et analyse des news compris.
            </p>
            <ul className="mt-6 space-y-2 text-sm">
              {["Trades illimités", "Imports MT4 / MT5 / CSV", "Calendrier économique et analyses IA", "Bilans du coach IA", "Paiement Mobile Money"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <span className="text-accent">✓</span> {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="glass glow rounded-3xl border border-accent/30 p-8 text-center">
            <p className="text-sm text-muted">Abonnement mensuel</p>
            <p className="mt-2 text-5xl font-extrabold">
              <span className="text-gradient">{formatFcfa(PRICE_FCFA)}</span>
            </p>
            <p className="mt-1 text-sm text-muted">par mois · sans engagement</p>
            <Link
              href="/inscription"
              className="mt-6 block rounded-xl bg-gradient-to-r from-accent to-accent-2 px-6 py-3 font-semibold text-black transition hover:opacity-90"
            >
              Commencer l&apos;essai gratuit
            </Link>
          </div>
        </section>

        <section className="mx-auto mt-24 max-w-3xl">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">Questions fréquentes</h2>
          <div className="mt-8 space-y-3">
            {FAQ.map((f) => (
              <details key={f.q} className="glass group rounded-2xl border border-white/5 p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                  {f.q}
                  <span className="text-accent transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <footer className="mt-24 border-t border-white/5 pt-6 text-center text-xs text-muted">
          © {new Date().getFullYear()} Capital Tracker · Le trading comporte des risques de perte en capital.
        </footer>
      </main>
    </div>
  );
}
