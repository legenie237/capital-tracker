import type { Metadata } from "next";
import Link from "next/link";
import { DashboardView } from "@/components/dashboard-view";
import { TradeTable } from "@/components/trades/trade-table";
import { demoTrades } from "@/lib/demo-data";
import { CoachView } from "@/components/coach/coach-view";
import { DEMO_REVIEW } from "@/lib/coach/demo-review";

export const metadata: Metadata = {
  title: "Démo · Capital Tracker",
  description: "Découvrez Capital Tracker avec un compte de démonstration rempli de trades fictifs.",
};

export default function DemoPage() {
  const trades = demoTrades();
  const recent = [...trades].reverse().slice(0, 15);

  return (
    <div className="min-h-screen">
      <div className="bg-accent px-4 py-2 text-center text-sm font-medium text-black">
        Compte de démonstration avec des trades fictifs.{" "}
        <Link href="/inscription" className="underline">Créez votre compte</Link> pour suivre vos vrais trades.
      </div>
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="font-bold">
            Capital <span className="text-accent">Tracker</span>
          </Link>
          <Link href="/inscription" className="rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-black hover:opacity-90">
            Commencer
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <div>
          <h1 className="text-2xl font-semibold">Tableau de bord (démo)</h1>
          <p className="mt-1 text-sm text-muted">3 mois de trading fictif, avec un risque fixe de 50 par trade.</p>
        </div>
        <DashboardView trades={trades} />
        <div className="pt-4">
          <h2 className="text-xl font-semibold">Coach IA</h2>
          <p className="mt-1 text-sm text-muted">Chaque semaine, le coach lit ton journal et te dit quoi corriger. Exemple de bilan :</p>
        </div>
        <CoachView
          demo
          reviews={[{ id: "demo", created_at: "2026-11-27T18:00:00Z", content: DEMO_REVIEW }]}
          left={{ bilan: 0, question: 0 }}
        />
        <h2 className="pt-4 text-xl font-semibold">Derniers trades</h2>
        <TradeTable trades={recent} />
      </main>
    </div>
  );
}
