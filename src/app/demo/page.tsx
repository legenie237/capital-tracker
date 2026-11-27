import type { Metadata } from "next";
import Link from "next/link";
import { DashboardView } from "@/components/dashboard-view";
import { TradeTable } from "@/components/trades/trade-table";
import { demoTrades } from "@/lib/demo-data";

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
        <h2 className="pt-4 text-xl font-semibold">Derniers trades</h2>
        <TradeTable trades={recent} />
      </main>
    </div>
  );
}
