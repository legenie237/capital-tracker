import Link from "next/link";
import { Card } from "@/components/ui";
import { EquityChart } from "@/components/equity-chart";
import { PnlCalendar } from "@/components/pnl-calendar";
import { computeStats, type Breakdown, type StatTrade } from "@/lib/stats";
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

function BreakdownTable({ title, rows, hint, limit = 6 }: { title: string; rows: Breakdown[]; hint?: string; limit?: number }) {
  return (
    <Card className="p-4">
      <h2 className="font-semibold">{title}</h2>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-muted">Pas encore de données.</p>
      ) : (
        <table className="mt-3 w-full text-sm">
          <thead className="text-left text-muted">
            <tr>
              <th className="pb-2 font-normal" />
              <th className="pb-2 text-right font-normal">Trades</th>
              <th className="pb-2 text-right font-normal">Réussite</th>
              <th className="pb-2 text-right font-normal">Net</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, limit).map((r) => (
              <tr key={r.key} className="border-t border-border">
                <td className="py-2">
                  {r.key}
                  {r.count < 10 && <span className="ml-1 text-xs text-muted" title="Moins de 10 trades : résultat peu fiable">(peu de données)</span>}
                </td>
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

/** Tableau de bord complet, utilisé pour le compte du trader et pour la page démo. */
export function DashboardView({ trades, newTradeHref }: { trades: StatTrade[]; newTradeHref?: string }) {
  const s = computeStats(trades);
  const tone = (n: number) => (n > 0 ? "good" : n < 0 ? "bad" : undefined);
  const mistakesCost = s.byMistake.reduce((sum, m) => sum + Math.min(0, m.net), 0);

  return (
    <div className="space-y-6">
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

      {s.total === 0 ? (
        <Card>
          <p className="text-muted">
            Aucun trade clôturé pour l&apos;instant.{" "}
            {newTradeHref && <Link href={newTradeHref} className="text-accent">Ajoutez votre premier trade</Link>} pour voir vos
            statistiques, votre calendrier et votre courbe d&apos;équité.
          </p>
        </Card>
      ) : (
        <>
          <div className="grid gap-4">
            <Card>
              <h2 className="mb-4 font-semibold">Courbe d&apos;équité</h2>
              <EquityChart points={s.equity} />
            </Card>
            <Card>
              <h2 className="mb-4 font-semibold">Calendrier des résultats</h2>
              <PnlCalendar results={s.results} />
            </Card>
          </div>

          <Card>
            <h2 className="font-semibold">Ce que vous coûtent vos erreurs</h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-sm text-muted">Pertes sur les trades avec erreur</p>
                <p className="text-2xl font-semibold tabular-nums text-danger">{formatMoney(mistakesCost)}</p>
              </div>
              <div>
                <p className="text-sm text-muted">Résultat des trades sans erreur ({s.cleanCount})</p>
                <p className={`text-2xl font-semibold tabular-nums ${s.cleanNet >= 0 ? "text-accent" : "text-danger"}`}>{formatMoney(s.cleanNet)}</p>
              </div>
              <div>
                <p className="text-sm text-muted">Erreur la plus coûteuse</p>
                <p className="text-lg font-semibold">{s.byMistake[0]?.net < 0 ? s.byMistake[0].key : "Aucune"}</p>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Tile label="Meilleur trade" value={formatMoney(s.best)} tone={tone(s.best)} />
            <Tile label="Pire trade" value={formatMoney(s.worst)} tone={tone(s.worst)} />
            <Tile label="Série de gains max" value={String(s.maxWinStreak)} />
            <Tile label="Série de pertes max" value={String(s.maxLossStreak)} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <BreakdownTable title="Erreurs" rows={s.byMistake} hint="Classées de la plus coûteuse à la moins coûteuse" limit={8} />
            <BreakdownTable title="Par setup" rows={s.bySetup} />
            <BreakdownTable title="Par instrument" rows={s.bySymbol} />
            <BreakdownTable title="Par session" rows={s.bySession} />
            <BreakdownTable title="Par jour de la semaine" rows={s.byWeekday} />
          </div>
        </>
      )}
    </div>
  );
}
