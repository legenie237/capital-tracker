import { createClient } from "@/lib/supabase/server";
import { CalendarView } from "@/components/news/calendar-view";
import { fetchCalendar } from "@/lib/news/calendar";

export const metadata = { title: "Calendrier économique – Capital Tracker" };

/** Devises que le trader a tradées (ex. XAUUSD -> USD, EURJPY -> EUR et JPY). */
function currenciesOf(symbols: string[], known: string[]) {
  const out = new Set<string>();
  for (const s of symbols) {
    const up = s.toUpperCase();
    for (const c of known) if (up.includes(c)) out.add(c);
    if (/NAS|US30|SPX|US500|BTC|ETH/.test(up)) out.add("USD");
    if (/GER|DAX/.test(up)) out.add("EUR");
  }
  return [...out].sort();
}

export default async function NewsPage() {
  const supabase = await createClient();
  const [{ events, error }, { data: trades }] = await Promise.all([
    fetchCalendar(),
    supabase.from("trades").select("symbol").order("opened_at", { ascending: false }).limit(300),
  ]);
  const known = [...new Set(events.map((e) => e.currency))];
  const mine = currenciesOf([...new Set((trades ?? []).map((t) => t.symbol as string))], known);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Calendrier économique</h1>
        <p className="text-muted">
          Les annonces de la semaine, à ton heure locale. Clique sur une news pour son analyse IA : scénarios, paires touchées et plan de préparation.
        </p>
      </div>
      {error ? (
        <p className="rounded-xl border border-border p-4 text-muted">
          Le calendrier est momentanément indisponible. Réessaie dans quelques minutes.
        </p>
      ) : (
        <CalendarView events={events} myCurrencies={mine} />
      )}
      <p className="text-xs text-muted">Mise à jour automatique toutes les 30 minutes.</p>
    </div>
  );
}
