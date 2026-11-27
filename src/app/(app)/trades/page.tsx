import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui";
import { formatDate, formatMoney, TRADE_COLUMNS } from "@/lib/trades";
import { netOf } from "@/lib/stats";
import type { Trade } from "@/lib/types";

type Search = { symbole?: string; direction?: string; resultat?: string; du?: string; au?: string };

const field = "rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent";

export default async function TradesPage({ searchParams }: { searchParams: Promise<Search> }) {
  const f = await searchParams;
  const supabase = await createClient();

  let q = supabase.from("trades").select(TRADE_COLUMNS).order("opened_at", { ascending: false }).limit(500);
  if (f.symbole) q = q.ilike("symbol", `%${f.symbole.replace(/[%_]/g, "")}%`);
  if (f.direction === "buy" || f.direction === "sell") q = q.eq("direction", f.direction);
  if (f.resultat === "ouvert") q = q.eq("status", "open");
  if (f.du) q = q.gte("opened_at", f.du);
  if (f.au) q = q.lte("opened_at", `${f.au}T23:59:59`);
  const { data, error } = await q.returns<Trade[]>();

  let trades = data ?? [];
  if (f.resultat === "gain") trades = trades.filter((t) => t.status === "closed" && netOf(t) > 0);
  if (f.resultat === "perte") trades = trades.filter((t) => t.status === "closed" && netOf(t) < 0);
  const total = trades.filter((t) => t.status === "closed").reduce((s, t) => s + netOf(t), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Journal de trades</h1>
        <Link href="/trades/nouveau" className="rounded-lg bg-accent px-4 py-2 font-semibold text-black hover:opacity-90">
          + Nouveau trade
        </Link>
      </div>

      <form className="flex flex-wrap items-end gap-3">
        <input name="symbole" defaultValue={f.symbole} placeholder="Instrument" className={`${field} w-32`} />
        <select name="direction" defaultValue={f.direction ?? ""} className={field}>
          <option value="">Toutes directions</option>
          <option value="buy">Achats</option>
          <option value="sell">Ventes</option>
        </select>
        <select name="resultat" defaultValue={f.resultat ?? ""} className={field}>
          <option value="">Tous résultats</option>
          <option value="gain">Gagnants</option>
          <option value="perte">Perdants</option>
          <option value="ouvert">En cours</option>
        </select>
        <label className="text-sm text-muted">
          Du <input type="date" name="du" defaultValue={f.du} className={field} />
        </label>
        <label className="text-sm text-muted">
          au <input type="date" name="au" defaultValue={f.au} className={field} />
        </label>
        <button className="rounded-lg border border-border px-4 py-2 text-sm hover:border-accent">Filtrer</button>
        <Link href="/trades" className="py-2 text-sm text-muted hover:text-foreground">Réinitialiser</Link>
      </form>

      {error && <p className="text-danger">Impossible de charger les trades : {error.message}</p>}

      {trades.length === 0 ? (
        <Card>
          <p className="text-muted">
            Aucun trade ici. <Link href="/trades/nouveau" className="text-accent">Ajoutez votre premier trade</Link>.
          </p>
        </Card>
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-border text-left text-muted">
              <tr>
                <th className="px-4 py-3 font-normal">Date</th>
                <th className="px-4 py-3 font-normal">Instrument</th>
                <th className="px-4 py-3 font-normal">Direction</th>
                <th className="px-4 py-3 font-normal">Setup</th>
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
                    <td className="px-4 py-3">
                      <Link href={`/trades/${t.id}`} className="hover:text-accent">{formatDate(t.opened_at)}</Link>
                    </td>
                    <td className="px-4 py-3 font-medium">
                      <Link href={`/trades/${t.id}`} className="hover:text-accent">{t.symbol}</Link>
                    </td>
                    <td className="px-4 py-3">{t.direction === "buy" ? "Achat" : "Vente"}</td>
                    <td className="px-4 py-3 text-muted">{t.setup ?? "–"}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{r === null ? "–" : `${r.toFixed(2)} R`}</td>
                    <td className={`px-4 py-3 text-right font-medium tabular-nums ${t.status === "open" ? "text-muted" : net > 0 ? "text-accent" : net < 0 ? "text-danger" : ""}`}>
                      {t.status === "open" ? "En cours" : `${net > 0 ? "+" : ""}${formatMoney(net)}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="border-t border-border text-muted">
              <tr>
                <td colSpan={5} className="px-4 py-3">{trades.length} trade(s)</td>
                <td className="px-4 py-3 text-right font-medium tabular-nums text-foreground">{formatMoney(total)}</td>
              </tr>
            </tfoot>
          </table>
        </Card>
      )}
    </div>
  );
}
