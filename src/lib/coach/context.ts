import { computeStats, netOf, type Breakdown, type Stats } from "../stats";
import type { Trade } from "../types";

export type CoachTrade = Pick<
  Trade,
  | "symbol"
  | "direction"
  | "status"
  | "pnl"
  | "fees"
  | "risk_amount"
  | "opened_at"
  | "closed_at"
  | "setup"
  | "session"
  | "emotions"
  | "followed_plan"
  | "mistakes"
  | "notes"
>;

export const COACH_TRADE_COLUMNS =
  "symbol, direction, status, pnl, fees, risk_amount, opened_at, closed_at, setup, session, emotions, followed_plan, mistakes, notes";

const DAY = 24 * 60 * 60 * 1000;
const MAX_LISTED = 60;
const MAX_NOTE = 300;

const r2 = (n: number) => Math.round(n * 100) / 100;
const pct = (n: number | null) => (n === null ? "n/a" : `${Math.round(n)} %`);

function summary(s: Stats) {
  return [
    `trades clôturés: ${s.total} (gagnants ${s.wins}, perdants ${s.losses})`,
    `taux de réussite: ${pct(s.winRate)}`,
    `résultat net: ${r2(s.net)}`,
    `gain moyen: ${r2(s.avgWin)} | perte moyenne: ${r2(s.avgLoss)}`,
    `profit factor: ${s.profitFactor === null ? "n/a" : r2(s.profitFactor)}`,
    `espérance par trade: ${r2(s.expectancy)}`,
    `R moyen: ${s.avgR === null ? "n/a" : r2(s.avgR)}`,
    `drawdown max: ${r2(s.maxDrawdown)}`,
    `meilleur trade: ${r2(s.best)} | pire trade: ${r2(s.worst)}`,
    `plus longue série gagnante: ${s.maxWinStreak} | perdante: ${s.maxLossStreak}`,
    `plan respecté: ${pct(s.planRate)}`,
    `résultat des trades sans erreur: ${r2(s.cleanNet)} sur ${s.cleanCount} trades`,
  ].join("\n");
}

function table(title: string, rows: Breakdown[]) {
  if (!rows.length) return `${title}: aucune donnée`;
  return `${title}:\n${rows
    .slice(0, 8)
    .map((b) => `- ${b.key}: ${b.count} trades, réussite ${pct(b.winRate)}, net ${r2(b.net)}`)
    .join("\n")}`;
}

function line(t: CoachTrade) {
  const parts = [
    (t.closed_at ?? t.opened_at).slice(0, 16).replace("T", " "),
    t.symbol,
    t.direction === "buy" ? "achat" : "vente",
    t.status === "open" ? "ouvert" : `net ${r2(netOf(t))}`,
  ];
  if (t.risk_amount) parts.push(`risque ${r2(t.risk_amount)}`);
  if (t.setup) parts.push(`setup ${t.setup}`);
  if (t.session) parts.push(`session ${t.session}`);
  if (t.followed_plan !== null) parts.push(t.followed_plan ? "plan respecté" : "plan NON respecté");
  if (t.emotions?.length) parts.push(`émotions: ${t.emotions.join(", ")}`);
  if (t.mistakes?.length) parts.push(`erreurs: ${t.mistakes.join(", ")}`);
  let out = `- ${parts.join(" | ")}`;
  const note = t.notes?.trim().replace(/\s+/g, " ");
  if (note) out += `\n  note: ${note.length > MAX_NOTE ? note.slice(0, MAX_NOTE) + "…" : note}`;
  return out;
}

/** Résumé texte des trades d'un trader, envoyé au coach IA. */
export function buildCoachContext(trades: CoachTrade[], now = new Date(), days = 7) {
  const since = new Date(now.getTime() - days * DAY);
  const when = (t: CoachTrade) => new Date(t.closed_at ?? t.opened_at);
  const recent = trades
    .filter((t) => when(t) >= since && when(t) <= now)
    .sort((a, b) => when(b).getTime() - when(a).getTime());

  const all = computeStats(trades);
  const week = computeStats(recent);
  const listed = recent.slice(0, MAX_LISTED);

  const text = [
    `Date du jour: ${now.toISOString().slice(0, 10)}`,
    "",
    `## Période analysée: ${days} derniers jours (depuis le ${since.toISOString().slice(0, 10)})`,
    summary(week),
    table("Par symbole", week.bySymbol),
    table("Par session", week.bySession),
    table("Par setup", week.bySetup),
    table("Par jour de la semaine", week.byWeekday),
    table("Coût de chaque erreur", week.byMistake),
    "",
    "## Historique complet (pour comparer)",
    summary(all),
    table("Par symbole", all.bySymbol),
    table("Par setup", all.bySetup),
    table("Coût de chaque erreur", all.byMistake),
    "",
    `## Trades de la période (${listed.length} sur ${recent.length}, du plus récent au plus ancien)`,
    listed.length ? listed.map(line).join("\n") : "aucun trade sur la période",
  ].join("\n");

  return { text, recentCount: recent.length, totalCount: all.total, since, until: now };
}
