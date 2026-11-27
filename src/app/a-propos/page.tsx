import Link from "next/link";
import { Icons } from "@/components/icons";
import { PRICE_FCFA, TRIAL_DAYS, formatFcfa } from "@/lib/billing";

export const metadata = {
  title: "À propos – Capital Tracker",
  description: "Pourquoi Capital Tracker existe, ce qu'il fait et comment il protège tes données.",
};

const VALUES = [
  { icon: Icons.chart, title: "La discipline avant tout", text: "Un bon trader n'est pas celui qui gagne chaque trade, mais celui qui suit son plan et apprend de ses erreurs. Tout le site est pensé pour ça." },
  { icon: Icons.shield, title: "Tes données t'appartiennent", text: "Chaque trader ne voit que ses propres trades, protégés au niveau de la base de données. Nous ne vendons aucune donnée." },
  { icon: Icons.phone, title: "Pensé pour l'Afrique", text: `Paiement en FCFA par Mobile Money, un prix accessible (${formatFcfa(PRICE_FCFA)}/mois) et un site léger qui marche bien sur téléphone.` },
  { icon: Icons.coach, title: "L'IA au service de ta progression", text: "Le coach et l'analyseur de news t'aident à comprendre et à te préparer. Ils ne remplacent pas ta réflexion et ne donnent pas de signaux." },
];

const FEATURES = [
  "Journal de trading complet (captures, émotions, erreurs, respect du plan)",
  "Import automatique depuis MetaTrader 4/5 et fichiers CSV",
  "Statistiques avancées : taux de réussite, R moyen, drawdown, calendrier",
  "Calendrier économique avec analyse IA de chaque annonce",
  "Coach IA : bilan hebdomadaire et réponses à tes questions",
];

export default function AboutPage() {
  return (
    <div className="relative overflow-x-hidden">
      <div className="bg-grid pointer-events-none absolute inset-x-0 top-0 h-96" aria-hidden />
      <main className="relative mx-auto max-w-4xl px-4 pb-16 pt-6 sm:px-6">
        <nav className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-accent to-accent-2 text-black">
              <Icons.chart width={18} height={18} strokeWidth={2.4} />
            </span>
            <span>
              Capital <span className="text-gradient">Tracker</span>
            </span>
          </Link>
          <Link href="/dashboard" className="text-sm text-muted hover:text-foreground">
            Mon espace
          </Link>
        </nav>

        <section className="animate-fade-up pt-14 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
            À propos de <span className="text-gradient">Capital Tracker</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-muted sm:text-lg">
            Capital Tracker est un journal de trading en ligne qui aide les traders à progresser : noter chaque trade, comprendre ses erreurs,
            préparer les annonces économiques et gagner en discipline, jour après jour.
          </p>
        </section>

        <section className="glass glow mt-12 rounded-3xl border border-white/5 p-6 sm:p-8">
          <h2 className="text-xl font-bold">Notre mission</h2>
          <p className="mt-3 text-muted">
            La plupart des traders perdent non pas faute de stratégie, mais faute de suivi. Sans journal, on répète les mêmes erreurs : entrer trop tôt,
            déplacer son stop, trader pendant une news, se venger après une perte. Capital Tracker rend ces erreurs visibles et mesurables, pour que tu
            puisses les corriger.
          </p>
          <p className="mt-3 text-muted">
            Le projet est né au Cameroun, avec une idée simple : offrir aux traders d&apos;Afrique francophone un outil moderne, en français, payable en
            FCFA, au niveau des meilleurs journaux de trading du monde.
          </p>
        </section>

        <section className="mt-12 grid gap-4 sm:grid-cols-2">
          {VALUES.map((v) => (
            <div key={v.title} className="glass rounded-2xl border border-white/5 p-6">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent/10 text-accent">
                <v.icon width={20} height={20} />
              </span>
              <h3 className="mt-4 font-semibold">{v.title}</h3>
              <p className="mt-2 text-sm text-muted">{v.text}</p>
            </div>
          ))}
        </section>

        <section className="mt-12 grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="text-xl font-bold">Ce que tu peux faire</h2>
            <ul className="mt-4 space-y-2 text-sm">
              {FEATURES.map((f) => (
                <li key={f} className="flex gap-2">
                  <span className="text-accent">✓</span> {f}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-xl font-bold">Le fondateur</h2>
            <p className="mt-4 text-sm text-muted">
              Capital Tracker est créé et développé par <span className="font-semibold text-foreground">Ngangni Samari Malachie</span>, pour
              donner aux traders un outil simple et complet pour suivre leur progression.
            </p>
            <p className="mt-3 text-sm text-muted">
              {TRIAL_DAYS} jours d&apos;essai gratuit, puis {formatFcfa(PRICE_FCFA)} par mois, sans engagement.
            </p>
          </div>
        </section>

        <section className="mt-12 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5 text-sm">
          <p className="font-semibold">Avertissement sur les risques</p>
          <p className="mt-1 text-muted">
            Le trading sur le Forex, les indices, l&apos;or et les cryptomonnaies comporte un risque élevé de perte en capital. Capital Tracker est un
            outil de suivi et d&apos;apprentissage : les analyses et contenus IA sont éducatifs et ne constituent pas des conseils en investissement.
          </p>
        </section>

        <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/inscription"
            className="w-full rounded-xl bg-gradient-to-r from-accent to-accent-2 px-6 py-3 text-center font-semibold text-black transition hover:opacity-90 sm:w-auto"
          >
            Essai gratuit {TRIAL_DAYS} jours
          </Link>
          <Link href="/" className="w-full rounded-xl border border-white/10 px-6 py-3 text-center font-semibold transition hover:border-accent/50 sm:w-auto">
            Retour à l&apos;accueil
          </Link>
        </div>

        <footer className="mt-16 border-t border-white/5 pt-6 text-center text-xs text-muted">
          © {new Date().getFullYear()} Capital Tracker
        </footer>
      </main>
    </div>
  );
}
