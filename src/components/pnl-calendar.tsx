"use client";

import { useEffect, useMemo, useState } from "react";

type Result = { date: string; net: number };
const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const keyOf = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function fmt(n: number) {
  const s = Math.abs(n).toLocaleString("fr-FR", { maximumFractionDigits: 0 });
  return n > 0 ? `+${s}` : n < 0 ? `−${s}` : "0";
}

/** Calendrier mensuel du résultat net par jour (vert = gain, rouge = perte), avec total par semaine. */
export function PnlCalendar({ results }: { results: Result[] }) {
  // Calculé après le montage pour utiliser le fuseau horaire du navigateur
  const [month, setMonth] = useState<{ y: number; m: number } | null>(null);
  const [daily, setDaily] = useState<Map<string, { net: number; count: number }>>(new Map());

  useEffect(() => {
    const map = new Map<string, { net: number; count: number }>();
    for (const r of results) {
      const k = keyOf(new Date(r.date));
      const cur = map.get(k) ?? { net: 0, count: 0 };
      map.set(k, { net: cur.net + r.net, count: cur.count + 1 });
    }
    setDaily(map);
    const last = results.length ? new Date(results[results.length - 1].date) : new Date();
    setMonth({ y: last.getFullYear(), m: last.getMonth() });
  }, [results]);

  const weeks = useMemo(() => {
    if (!month) return [];
    const first = new Date(month.y, month.m, 1);
    const start = new Date(first);
    start.setDate(1 - ((first.getDay() + 6) % 7)); // lundi précédent
    const rows: Date[][] = [];
    const cur = new Date(start);
    while (rows.length < 6) {
      const row: Date[] = [];
      for (let i = 0; i < 7; i++) {
        row.push(new Date(cur));
        cur.setDate(cur.getDate() + 1);
      }
      rows.push(row);
      if (cur.getMonth() !== month.m && cur > first) break;
    }
    return rows;
  }, [month]);

  if (!month) return <div className="h-64" />;

  const inMonth = [...daily.entries()].filter(([k]) => k.startsWith(`${month.y}-${String(month.m + 1).padStart(2, "0")}`));
  const maxAbs = Math.max(1, ...inMonth.map(([, v]) => Math.abs(v.net)));
  const monthNet = inMonth.reduce((s, [, v]) => s + v.net, 0);
  const greenDays = inMonth.filter(([, v]) => v.net > 0).length;
  const label = new Date(month.y, month.m, 1).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const shift = (d: number) =>
    setMonth((p) => (p ? { y: p.m + d < 0 ? p.y - 1 : p.m + d > 11 ? p.y + 1 : p.y, m: (p.m + d + 12) % 12 } : p));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button onClick={() => shift(-1)} className="rounded border border-border px-2 py-1 text-sm hover:border-accent" aria-label="Mois précédent">‹</button>
          <span className="min-w-36 text-center font-medium capitalize">{label}</span>
          <button onClick={() => shift(1)} className="rounded border border-border px-2 py-1 text-sm hover:border-accent" aria-label="Mois suivant">›</button>
        </div>
        <p className="text-sm text-muted">
          Mois : <span className={`font-semibold tabular-nums ${monthNet > 0 ? "text-accent" : monthNet < 0 ? "text-danger" : "text-foreground"}`}>{fmt(monthNet)}</span>
          {" · "}
          {greenDays}/{inMonth.length} jours gagnants
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] table-fixed border-separate border-spacing-1 text-xs">
          <thead>
            <tr className="text-muted">
              {DAYS.map((d) => (
                <th key={d} className="pb-1 font-normal">{d}</th>
              ))}
              <th className="pb-1 font-normal">Semaine</th>
            </tr>
          </thead>
          <tbody>
            {weeks.map((row) => {
              const weekNet = row.reduce((s, d) => s + (d.getMonth() === month.m ? (daily.get(keyOf(d))?.net ?? 0) : 0), 0);
              return (
                <tr key={keyOf(row[0])}>
                  {row.map((d) => {
                    const v = daily.get(keyOf(d));
                    const out = d.getMonth() !== month.m;
                    const pct = v ? Math.round(18 + (Math.abs(v.net) / maxAbs) * 52) : 0;
                    const bg = !v || out || v.net === 0
                      ? undefined
                      : `color-mix(in srgb, var(${v.net > 0 ? "--accent" : "--danger"}) ${pct}%, var(--surface))`;
                    return (
                      <td
                        key={keyOf(d)}
                        className={`h-16 rounded-md border border-border p-1.5 align-top ${out ? "opacity-30" : ""}`}
                        style={{ background: bg }}
                        title={v && !out ? `${d.toLocaleDateString("fr-FR")} : ${fmt(v.net)} (${v.count} trade${v.count > 1 ? "s" : ""})` : undefined}
                      >
                        <div className="text-muted">{d.getDate()}</div>
                        {v && !out && (
                          <>
                            <div className="mt-1 font-semibold tabular-nums text-foreground">{fmt(v.net)}</div>
                            <div className="text-muted">{v.count} trade{v.count > 1 ? "s" : ""}</div>
                          </>
                        )}
                      </td>
                    );
                  })}
                  <td className="h-16 rounded-md bg-background p-1.5 text-center align-middle font-semibold tabular-nums text-foreground">
                    {fmt(weekNet)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
