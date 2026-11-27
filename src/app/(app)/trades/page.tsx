import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui";
import { TRADE_COLUMNS } from "@/lib/trades";
import { TradeTable } from "@/components/trades/trade-table";
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
        <TradeTable trades={trades} linkBase="/trades" />
      )}
    </div>
  );
}
