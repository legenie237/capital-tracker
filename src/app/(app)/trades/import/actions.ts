"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ImportedTrade } from "@/lib/import/parse";

export type ImportResult = { error?: string; inserted?: number; duplicates?: number };

const MAX_ROWS = 1000;

/**
 * Enregistre un lot de trades importés. Les dates arrivent sans fuseau (heure de la plateforme) :
 * `tzOffsetMin` est le décalage du navigateur, pour les enregistrer à la bonne heure.
 * Les trades déjà présents (même source et même identifiant) sont ignorés.
 */
export async function importTrades(
  source: "mt5" | "csv",
  trades: ImportedTrade[],
  tzOffsetMin: number,
): Promise<ImportResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Session expirée, reconnectez-vous." };
  if (!Array.isArray(trades) || trades.length === 0) return { error: "Aucun trade à importer." };
  if (trades.length > MAX_ROWS) return { error: `Maximum ${MAX_ROWS} trades par envoi.` };

  const toIso = (local: string | null) => {
    if (!local) return null;
    const t = Date.parse(`${local}Z`) + (Number(tzOffsetMin) || 0) * 60_000;
    return Number.isFinite(t) ? new Date(t).toISOString() : null;
  };
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);

  const rows = [];
  for (const t of trades) {
    const opened = toIso(t.opened_at);
    if (!opened || !t.symbol || (t.direction !== "buy" && t.direction !== "sell") || num(t.entry_price) === null || num(t.pnl) === null) {
      continue;
    }
    rows.push({
      user_id: user.id,
      source,
      external_id: String(t.external_id).slice(0, 100),
      symbol: String(t.symbol).toUpperCase().slice(0, 30),
      direction: t.direction,
      status: "closed",
      opened_at: opened,
      closed_at: toIso(t.closed_at) ?? opened,
      entry_price: num(t.entry_price),
      exit_price: num(t.exit_price),
      stop_loss: num(t.stop_loss),
      take_profit: num(t.take_profit),
      lot_size: num(t.lot_size),
      pnl: num(t.pnl),
      fees: num(t.fees) ?? 0,
    });
  }
  if (rows.length === 0) return { error: "Aucune ligne valide dans ce fichier." };

  const { data, error } = await supabase
    .from("trades")
    .upsert(rows, { onConflict: "user_id,source,external_id", ignoreDuplicates: true })
    .select("id");
  if (error) return { error: "Import impossible : " + error.message };

  revalidatePath("/trades");
  revalidatePath("/dashboard");
  const inserted = data?.length ?? 0;
  return { inserted, duplicates: rows.length - inserted };
}
