import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui";
import type { Trade } from "@/lib/types";

function computeStats(trades: Pick<Trade, "pnl" | "status">[]) {
  const closed = trades.filter((t) => t.status === "closed" && t.pnl !== null);
  const wins = closed.filter((t) => (t.pnl ?? 0) > 0);
  const losses = closed.filter((t) => (t.pnl ?? 0) < 0);
  const grossWin = wins.reduce((s, t) => s + (t.pnl ?? 0), 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + (t.pnl ?? 0), 0));
  return {
    total: closed.length,
    winRate: closed.length ? (wins.length / closed.length) * 100 : 0,
    netPnl: grossWin - grossLoss,
    profitFactor: grossLoss ? grossWin / grossLoss : null,
  };
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: trades } = await supabase.from("trades").select("pnl, status");
  const stats = computeStats(trades ?? []);

  const tiles = [
    { label: "Trades clôturés", value: String(stats.total) },
    { label: "Taux de réussite", value: `${stats.winRate.toFixed(1)} %` },
    { label: "Résultat net", value: stats.netPnl.toFixed(2) },
    { label: "Profit factor", value: stats.profitFactor ? stats.profitFactor.toFixed(2) : "–" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Tableau de bord</h1>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map((t) => (
          <Card key={t.label} className="p-4">
            <p className="text-sm text-muted">{t.label}</p>
            <p className="mt-1 text-2xl font-semibold">{t.value}</p>
          </Card>
        ))}
      </div>
      {stats.total === 0 && (
        <Card>
          <p className="text-muted">
            Aucun trade pour l&apos;instant. Le journal et l&apos;import automatique arrivent à l&apos;étape suivante.
          </p>
        </Card>
      )}
    </div>
  );
}
