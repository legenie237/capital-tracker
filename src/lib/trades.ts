export const SESSIONS = ["Asie", "Londres", "New York", "Chevauchement Londres/NY"] as const;
export const EMOTIONS = ["Calme", "Confiant", "Impatient", "Peur", "Avidité", "Frustration", "Revanche", "Fatigue"] as const;

export const TRADE_COLUMNS =
  "id, symbol, direction, status, entry_price, exit_price, stop_loss, take_profit, lot_size, pnl, fees, risk_amount, opened_at, closed_at, setup, session, emotions, followed_plan, notes, screenshots";

export function formatMoney(n: number | null | undefined) {
  if (n === null || n === undefined) return "–";
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatDate(iso: string | null | undefined) {
  if (!iso) return "–";
  return new Date(iso).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
}
