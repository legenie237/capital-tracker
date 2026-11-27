import Link from "next/link";
import { Card } from "@/components/ui";
import { formatDate, formatMoney } from "@/lib/trades";
import { netOf } from "@/lib/stats";
import type { Trade } from "@/lib/types";

/** Tableau des trades. Sans `linkBase`, les lignes ne sont pas cliquables (page démo). */
export function TradeTable({ trades, linkBase }: { trades: Trade[]; linkBase?: string }) {
  const total = trades.filter((t) => t.status === "closed").reduce((s, t) => s + netOf(t), 0);
  const cell = (t: Trade, children: React.ReactNode) =>
    linkBase ? <Link href={`${linkBase}/${t.id}`} className="hover:text-accent">{children}</Link> : children;

  return (
    <Card className="overflow-x-auto p-0">
      <table className="w-full min-w-[760px] text-sm">
        <thead className="border-b border-border text-left text-muted">
          <tr>
            <th className="px-4 py-3 font-normal">Date</th>
            <th className="px-4 py-3 font-normal">Instrument</th>
            <th className="px-4 py-3 font-normal">Direction</th>
            <th className="px-4 py-3 font-normal">Setup</th>
            <th className="px-4 py-3 font-normal">Erreurs</th>
            <th className="px-4 py-3 text-right font-normal">R</th>
            <th className="px-4 py-3 text-right font-normal">Résultat net</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((t) => {
            const net = netOf(t);
            const r = t.status === "closed" && t.risk_amount ? net / t.risk_amount : null;
            return (
              <tr key={t.id} className="border-b border-border last:border-0 hover:bg-background/60">
                <td className="whitespace-nowrap px-4 py-3">{cell(t, formatDate(t.opened_at))}</td>
                <td className="px-4 py-3 font-medium">{cell(t, t.symbol)}</td>
                <td className="px-4 py-3">{t.direction === "buy" ? "Achat" : "Vente"}</td>
                <td className="px-4 py-3 text-muted">{t.setup ?? "–"}</td>
                <td className="px-4 py-3 text-muted">{t.mistakes?.length ? t.mistakes.join(", ") : "–"}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">{r === null ? "–" : `${r.toFixed(2)} R`}</td>
                <td className={`whitespace-nowrap px-4 py-3 text-right font-medium tabular-nums ${t.status === "open" ? "text-muted" : net > 0 ? "text-accent" : net < 0 ? "text-danger" : ""}`}>
                  {t.status === "open" ? "En cours" : `${net > 0 ? "+" : ""}${formatMoney(net)}`}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot className="border-t border-border text-muted">
          <tr>
            <td colSpan={6} className="px-4 py-3">{trades.length} trade(s)</td>
            <td className="px-4 py-3 text-right font-medium tabular-nums text-foreground">{formatMoney(total)}</td>
          </tr>
        </tfoot>
      </table>
    </Card>
  );
}
