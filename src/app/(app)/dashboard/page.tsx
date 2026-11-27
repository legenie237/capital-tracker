import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui";
import { EquityChart } from "@/components/equity-chart";
import { computeStats, type Breakdown } from "@/lib/stats";
import { formatMoney } from "@/lib/trades";

function Tile({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: "good" | "bad" }) {
  return (
    <Card className="p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${tone === "good" ? "text-accent" : tone === "bad" ? "text-danger" : ""}`}>
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </Card>
  );
}

function BreakdownTable({ title, rows }: { title: string; rows: Breakdown[] }) {
  return (
    <Card className="p-4">
      <h2 className="mb-3 font-semibold">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-muted">Pas encore de données.</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="text-left text-muted">
            <tr>
              <th className="pb-2 font-normal" />
              <th className="pb-2 text-right font-normal">Trades</th>
              <th className="pb-2 text-right font-normal">Réussite</th>
              <th className="pb-2 text-right font-normal">Net</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 6).map((r) => (
              <tr key={r.key} className="border-t border-border">
                <td className="py-2">{r.key}</td>
                <td className="py-2 text-right tabular-nums">{r.count}</td>
                <td className="py-2 text-right tabular-nums">{r.winRate.toFixed(0)} %</td>
                <td className={`py-2 text-right tabular-nums ${r.net > 0 ? "text-accent" : r.net < 0 ? "text-danger" : ""}`}>
                  {formatMoney(r.net)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("trades")
    .select("pnl, fees, risk_amount, status, opened_at, closed_at, symbol, setup, session, followed_plan");
  const s = computeStats(data ?? []);
  const tone = (n: number) => (n > 0 ? "good" : n < 0 ? "bad" : undefined);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Tableau de bord</h1>
        <Link href="/trades/nouveau" className="rounded-lg bg-accent px-4 py-2 font-semibold text-black hover:opacity-90">
          + Nouveau trade
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Tile label="Résultat net" value={formatMoney(s.net)} tone={tone(s.net)} hint={`${s.total} trades clôturés`} />
        <Tile label="Taux de réussite" value={`${s.winRate.toFixed(1)} %`} hint={`${s.wins} gagnants · ${s.losses} perdants`} />
        <Tile label="Profit factor" value={s.profitFactor ? s.profitFactor.toFixed(2) : "–"} hint="Gains bruts ÷ pertes brutes" />
        <Tile label="Espérance par trade" value={formatMoney(s.expectancy)} tone={tone(s.expectancy)} hint="Ce que rapporte un trade en moyenne" />
        <Tile label="R moyen" value={s.avgR === null ? "–" : `${s.avgR.toFixed(2)} R`} hint="Résultat ÷ montant risqué" />
        <Tile label="Drawdown maximum" value={formatMoney(s.maxDrawdown)} hint="Plus forte baisse depuis un sommet" />
        <Tile label="Gain moyen / perte moyenne" value={`${formatMoney(s.avgWin)} / ${formatMoney(s.avgLoss)}`} />
        <Tile label="Discipline" value={s.planRate === null ? "–" : `${s.planRate.toFixed(0)} %`} hint="Trades où le plan a été respecté" />
      </div>

      <Card>
        <h2 className="mb-4 font-semibold">Courbe d&apos;équité</h2>
        <EquityChart points={s.equity} />
      </Card>

      {s.total === 0 ? (
        <Card>
          <p className="text-muted">
            Aucun trade clôturé pour l&apos;instant.{" "}
            <Link href="/trades/nouveau" className="text-accent">Ajoutez votre premier trade</Link> pour voir vos statistiques.
          </p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Tile label="Meilleur trade" value={formatMoney(s.best)} tone={tone(s.best)} />
            <Tile label="Pire trade" value={formatMoney(s.worst)} tone={tone(s.worst)} />
            <Tile label="Série de gains max" value={String(s.maxWinStreak)} />
            <Tile label="Série de pertes max" value={String(s.maxLossStreak)} />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <BreakdownTable title="Par instrument" rows={s.bySymbol} />
            <BreakdownTable title="Par setup" rows={s.bySetup} />
            <BreakdownTable title="Par session" rows={s.bySession} />
            <BreakdownTable title="Par jour de la semaine" rows={s.byWeekday} />
          </div>
        </>
      )}
    </div>
  );
}
