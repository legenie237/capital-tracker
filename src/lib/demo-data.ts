import type { Trade } from "./types";
import { MISTAKES, SESSIONS } from "./trades";

/** Générateur pseudo-aléatoire déterministe : la démo affiche toujours les mêmes trades. */
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

const INSTRUMENTS = [
  { symbol: "EURUSD", price: 1.085, pip: 0.0001 },
  { symbol: "GBPUSD", price: 1.27, pip: 0.0001 },
  { symbol: "USDJPY", price: 151.2, pip: 0.01 },
  { symbol: "XAUUSD", price: 2650, pip: 0.1 },
  { symbol: "NAS100", price: 20500, pip: 1 },
  { symbol: "BTCUSD", price: 96000, pip: 10 },
];
const SETUPS = ["Cassure de range", "Pullback sur tendance", "Retournement sur support", "Ouverture de Londres"];

/**
 * Environ 110 trades fictifs sur les 3 derniers mois (jours ouvrés), avec un compte qui progresse,
 * des erreurs plus fréquentes sur les trades perdants et un setup nettement meilleur que les autres.
 */
export function demoTrades(now = new Date("2026-11-27T18:00:00Z")): Trade[] {
  const r = rng(237);
  const trades: Trade[] = [];
  const start = new Date(now);
  start.setUTCDate(start.getUTCDate() - 90);

  for (let d = new Date(start); d <= now; d.setUTCDate(d.getUTCDate() + 1)) {
    const wd = d.getUTCDay();
    if (wd === 0 || wd === 6) continue;
    const count = r() < 0.2 ? 0 : 1 + Math.floor(r() * 2.2);
    for (let k = 0; k < count; k++) {
      const inst = INSTRUMENTS[Math.floor(r() * INSTRUMENTS.length)];
      const setupIdx = Math.floor(r() * SETUPS.length);
      const session = SESSIONS[Math.floor(r() * 3)];
      const direction = r() < 0.55 ? "buy" : "sell";
      const risk = 50;
      const followed = r() < 0.75;
      // Le pullback sur tendance gagne plus souvent ; ne pas suivre son plan fait perdre
      const winProb = 0.42 + (setupIdx === 1 ? 0.18 : 0) + (followed ? 0.08 : -0.15);
      const win = r() < winProb;
      const rMultiple = win ? 0.8 + r() * 2.2 : -(0.5 + r() * 0.7);
      const pnl = Math.round(rMultiple * risk * 100) / 100;
      const mistakes: string[] = [];
      if (!followed) mistakes.push(MISTAKES[6]);
      if (!win && r() < 0.45) mistakes.push(MISTAKES[Math.floor(r() * 6)]);
      if (!win && r() < 0.12) mistakes.push(MISTAKES[7]);

      const opened = new Date(d);
      opened.setUTCHours(session === "Asie" ? 2 : session === "Londres" ? 8 : 14, Math.floor(r() * 60));
      const closed = new Date(opened.getTime() + (20 + r() * 240) * 60_000);
      const entry = inst.price * (1 + (r() - 0.5) * 0.04);
      const stopDist = inst.pip * (15 + Math.floor(r() * 30));
      const sign = direction === "buy" ? 1 : -1;
      const dec = inst.pip < 0.01 ? 5 : inst.pip < 1 ? 2 : 0;
      const round = (n: number) => Number(n.toFixed(dec));

      trades.push({
        id: `demo-${trades.length + 1}`,
        symbol: inst.symbol,
        direction,
        status: "closed",
        entry_price: round(entry),
        exit_price: round(entry + sign * stopDist * rMultiple),
        stop_loss: round(entry - sign * stopDist),
        take_profit: round(entry + sign * stopDist * 2),
        lot_size: Number((0.1 + r() * 0.9).toFixed(2)),
        pnl,
        fees: Number((r() * 3).toFixed(2)),
        risk_amount: risk,
        opened_at: opened.toISOString(),
        closed_at: closed.toISOString(),
        setup: SETUPS[setupIdx],
        session,
        emotions: win ? ["Calme"] : r() < 0.5 ? ["Impatient"] : ["Frustration"],
        followed_plan: followed,
        mistakes,
        notes: null,
        screenshots: [],
      });
    }
  }
  return trades;
}
