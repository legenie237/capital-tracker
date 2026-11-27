import type { Trade } from "./types";

export type StatTrade = Pick<
  Trade,
  "pnl" | "fees" | "risk_amount" | "status" | "opened_at" | "closed_at" | "symbol" | "setup" | "session" | "followed_plan"
> & { mistakes?: string[] | null };

export type Breakdown = { key: string; count: number; winRate: number; net: number };

export type Stats = {
  total: number;
  wins: number;
  losses: number;
  winRate: number;
  net: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number | null;
  expectancy: number;
  avgR: number | null;
  maxDrawdown: number;
  best: number;
  worst: number;
  maxWinStreak: number;
  maxLossStreak: number;
  planRate: number | null;
  equity: { date: string; value: number }[];
  results: { date: string; net: number }[];
  bySymbol: Breakdown[];
  bySession: Breakdown[];
  bySetup: Breakdown[];
  byWeekday: Breakdown[];
  byMistake: Breakdown[];
  cleanNet: number;
  cleanCount: number;
};

const WEEKDAYS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

export const netOf = (t: Pick<Trade, "pnl" | "fees">) => (t.pnl ?? 0) - (t.fees ?? 0);

function breakdown(trades: StatTrade[], keyOf: (t: StatTrade) => string | string[] | null): Breakdown[] {
  const groups = new Map<string, StatTrade[]>();
  for (const t of trades) {
    const k = keyOf(t);
    for (const key of Array.isArray(k) ? k : k ? [k] : []) {
      groups.set(key, [...(groups.get(key) ?? []), t]);
    }
  }
  return [...groups.entries()]
    .map(([key, list]) => ({
      key,
      count: list.length,
      winRate: (list.filter((t) => netOf(t) > 0).length / list.length) * 100,
      net: list.reduce((s, t) => s + netOf(t), 0),
    }))
    .sort((a, b) => b.net - a.net);
}

export function computeStats(all: StatTrade[]): Stats {
  const closed = all
    .filter((t) => t.status === "closed" && t.pnl !== null)
    .sort((a, b) => (a.closed_at ?? a.opened_at).localeCompare(b.closed_at ?? b.opened_at));

  const nets = closed.map(netOf);
  const winsList = nets.filter((n) => n > 0);
  const lossList = nets.filter((n) => n < 0);
  const grossWin = winsList.reduce((s, n) => s + n, 0);
  const grossLoss = Math.abs(lossList.reduce((s, n) => s + n, 0));
  const net = grossWin - grossLoss;

  // Courbe d'équité et drawdown maximum (depuis le plus haut atteint)
  let cum = 0;
  let peak = 0;
  let maxDrawdown = 0;
  const equity = closed.map((t, i) => {
    cum += nets[i];
    peak = Math.max(peak, cum);
    maxDrawdown = Math.max(maxDrawdown, peak - cum);
    return { date: t.closed_at ?? t.opened_at, value: cum };
  });

  // Séries de gains / pertes consécutifs
  let maxWinStreak = 0;
  let maxLossStreak = 0;
  let w = 0;
  let l = 0;
  for (const n of nets) {
    if (n > 0) { w++; l = 0; } else if (n < 0) { l++; w = 0; } else { w = 0; l = 0; }
    maxWinStreak = Math.max(maxWinStreak, w);
    maxLossStreak = Math.max(maxLossStreak, l);
  }

  const clean = closed.filter((t) => !t.mistakes?.length);

  const withRisk = closed.filter((t) => t.risk_amount && t.risk_amount > 0);
  const withPlan = closed.filter((t) => t.followed_plan !== null);

  return {
    total: closed.length,
    wins: winsList.length,
    losses: lossList.length,
    winRate: closed.length ? (winsList.length / closed.length) * 100 : 0,
    net,
    avgWin: winsList.length ? grossWin / winsList.length : 0,
    avgLoss: lossList.length ? -grossLoss / lossList.length : 0,
    profitFactor: grossLoss ? grossWin / grossLoss : null,
    expectancy: closed.length ? net / closed.length : 0,
    avgR: withRisk.length ? withRisk.reduce((s, t) => s + netOf(t) / t.risk_amount!, 0) / withRisk.length : null,
    maxDrawdown,
    best: nets.length ? Math.max(...nets) : 0,
    worst: nets.length ? Math.min(...nets) : 0,
    maxWinStreak,
    maxLossStreak,
    planRate: withPlan.length ? (withPlan.filter((t) => t.followed_plan).length / withPlan.length) * 100 : null,
    equity,
    results: closed.map((t, i) => ({ date: t.closed_at ?? t.opened_at, net: nets[i] })),
    bySymbol: breakdown(closed, (t) => t.symbol),
    bySession: breakdown(closed, (t) => t.session),
    bySetup: breakdown(closed, (t) => t.setup),
    byWeekday: breakdown(closed, (t) => WEEKDAYS[new Date(t.opened_at).getDay()]),
    // Les erreurs les plus coûteuses d'abord
    byMistake: breakdown(closed, (t) => t.mistakes ?? null).sort((a, b) => a.net - b.net),
    cleanNet: clean.reduce((s, t) => s + netOf(t), 0),
    cleanCount: clean.length,
  };
}
