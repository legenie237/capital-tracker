/** Calendrier économique : flux hebdomadaire gratuit (format Forex Factory), mis en cache 30 minutes. */

export const CALENDAR_URL =
  process.env.CALENDAR_FEED_URL || "https://nfs.faireconomy.media/ff_calendar_thisweek.json";

export type Impact = "high" | "medium" | "low" | "holiday";

export type EconEvent = {
  id: string;
  title: string;
  currency: string;
  date: string; // ISO UTC
  impact: Impact;
  forecast: string | null;
  previous: string | null;
  actual: string | null;
};

const IMPACTS: Record<string, Impact> = { high: "high", medium: "medium", low: "low", holiday: "holiday" };

function slug(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

const clean = (v: unknown) => {
  const s = typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : "";
  return s ? s : null;
};

/** Transforme le flux brut en événements propres, triés par date. Les lignes invalides sont ignorées. */
export function parseCalendar(raw: unknown): EconEvent[] {
  if (!Array.isArray(raw)) return [];
  const events: EconEvent[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const title = clean(r.title);
    const currency = clean(r.country ?? r.currency)?.toUpperCase();
    const when = new Date(String(r.date ?? ""));
    if (!title || !currency || Number.isNaN(when.getTime())) continue;
    const impact = IMPACTS[String(r.impact ?? "").toLowerCase()] ?? "low";
    const date = when.toISOString();
    events.push({
      id: `${date.slice(0, 16).replace(/[-:T]/g, "")}-${currency.toLowerCase()}-${slug(title)}`,
      title,
      currency,
      date,
      impact,
      forecast: clean(r.forecast),
      previous: clean(r.previous),
      actual: clean(r.actual),
    });
  }
  return events.sort((a, b) => a.date.localeCompare(b.date) || a.currency.localeCompare(b.currency));
}

export async function fetchCalendar(): Promise<{ events: EconEvent[]; error: boolean }> {
  try {
    const res = await fetch(CALENDAR_URL, {
      next: { revalidate: 1800 },
      headers: { "User-Agent": "CapitalTracker/1.0" },
    });
    if (!res.ok) return { events: [], error: true };
    return { events: parseCalendar(await res.json()), error: false };
  } catch {
    return { events: [], error: true };
  }
}

/** Paires les plus touchées par une devise. */
export const PAIRS: Record<string, string[]> = {
  USD: ["EURUSD", "GBPUSD", "USDJPY", "XAUUSD", "NAS100", "US30"],
  EUR: ["EURUSD", "EURGBP", "EURJPY", "GER40"],
  GBP: ["GBPUSD", "EURGBP", "GBPJPY", "UK100"],
  JPY: ["USDJPY", "EURJPY", "GBPJPY"],
  CAD: ["USDCAD", "CADJPY", "WTI"],
  AUD: ["AUDUSD", "AUDJPY"],
  NZD: ["NZDUSD", "AUDNZD"],
  CHF: ["USDCHF", "EURCHF"],
  CNY: ["AUDUSD", "XAUUSD", "USDCNH"],
};

export const IMPACT_LABEL: Record<Impact, string> = {
  high: "Fort",
  medium: "Moyen",
  low: "Faible",
  holiday: "Férié",
};
