"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { IMPACT_LABEL, type EconEvent, type Impact } from "@/lib/news/calendar";

const IMPACT_STYLE: Record<Impact, string> = {
  high: "bg-danger/15 text-danger border-danger/40",
  medium: "bg-amber-500/15 text-amber-400 border-amber-500/40",
  low: "bg-border text-muted border-border",
  holiday: "bg-sky-500/10 text-sky-400 border-sky-500/30",
};

const dayKey = (d: Date) => d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
const time = (d: Date) => d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

function countdown(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0 ? `${h} h ${String(m).padStart(2, "0")} min` : `${m} min ${String(sec).padStart(2, "0")} s`;
}

export function ImpactBadge({ impact }: { impact: Impact }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${IMPACT_STYLE[impact]}`}>
      {impact === "high" ? "●●●" : impact === "medium" ? "●●○" : impact === "low" ? "●○○" : "⛱"} {IMPACT_LABEL[impact]}
    </span>
  );
}

export function CalendarView({ events, myCurrencies }: { events: EconEvent[]; myCurrencies: string[] }) {
  const [now, setNow] = useState<number | null>(null);
  const [impact, setImpact] = useState<"all" | "high" | "medium+">("medium+");
  const [currency, setCurrency] = useState<string>("toutes");

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const currencies = useMemo(() => [...new Set(events.map((e) => e.currency))].sort(), [events]);
  const shown = events.filter(
    (e) =>
      (impact === "all" || (impact === "high" ? e.impact === "high" : e.impact === "high" || e.impact === "medium")) &&
      (currency === "toutes" || (currency === "mes devises" ? myCurrencies.includes(e.currency) : e.currency === currency)),
  );
  const nextHigh = now === null ? null : events.find((e) => e.impact === "high" && new Date(e.date).getTime() > now);

  const groups = new Map<string, EconEvent[]>();
  for (const e of shown) {
    const k = dayKey(new Date(e.date));
    groups.set(k, [...(groups.get(k) ?? []), e]);
  }

  if (now === null) {
    return (
      <div className="space-y-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-12 animate-pulse rounded-xl bg-surface" />
        ))}
      </div>
    );
  }

  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1 text-sm ${active ? "border-accent bg-accent/15 text-foreground" : "border-border text-muted hover:text-foreground"}`;

  return (
    <div className="space-y-6">
      {nextHigh && now !== null && (
        <Link
          href={`/news/${nextHigh.id}`}
          className="glow block rounded-2xl border border-danger/40 bg-gradient-to-r from-danger/15 via-surface to-surface p-5 hover:border-danger"
        >
          <p className="text-xs uppercase tracking-widest text-danger">Prochaine news à fort impact</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xl font-semibold">
                {nextHigh.currency} · {nextHigh.title}
              </p>
              <p className="text-sm text-muted">
                {dayKey(new Date(nextHigh.date))} à {time(new Date(nextHigh.date))}
                {nextHigh.forecast ? ` · prévision ${nextHigh.forecast}` : ""}
              </p>
            </div>
            <p className="font-mono text-3xl tabular-nums text-danger">{countdown(new Date(nextHigh.date).getTime() - now)}</p>
          </div>
        </Link>
      )}

      <div className="flex flex-wrap gap-2">
        <button className={chip(impact === "high")} onClick={() => setImpact("high")}>Fort impact</button>
        <button className={chip(impact === "medium+")} onClick={() => setImpact("medium+")}>Moyen et fort</button>
        <button className={chip(impact === "all")} onClick={() => setImpact("all")}>Tout</button>
        <span className="mx-1 w-px bg-border" />
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="rounded-full border border-border bg-background px-3 py-1 text-sm"
        >
          <option value="toutes">Toutes les devises</option>
          {myCurrencies.length > 0 && <option value="mes devises">Mes devises ({myCurrencies.join(", ")})</option>}
          {currencies.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {groups.size === 0 && <p className="text-muted">Aucune news pour ces filtres.</p>}

      {[...groups.entries()].map(([day, list]) => (
        <section key={day}>
          <h2 className="mb-2 text-sm font-semibold capitalize text-muted">{day}</h2>
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface/70 backdrop-blur">
            {list.map((e) => {
              const past = now !== null && new Date(e.date).getTime() < now;
              return (
                <li key={e.id}>
                  <Link
                    href={`/news/${e.id}`}
                    className={`grid grid-cols-[3.5rem_3rem_1fr] items-center gap-3 px-4 py-3 text-sm transition hover:bg-white/5 sm:grid-cols-[4rem_3.5rem_1fr_auto_auto] ${past ? "opacity-50" : ""}`}
                  >
                    <span className="font-mono tabular-nums text-muted">{time(new Date(e.date))}</span>
                    <span className="font-semibold">{e.currency}</span>
                    <span className="min-w-0 truncate">{e.title}</span>
                    <span className="col-span-3 flex gap-3 text-xs text-muted sm:col-span-1">
                      {e.actual && <span className="text-foreground">Réel {e.actual}</span>}
                      {e.forecast && <span>Prév. {e.forecast}</span>}
                      {e.previous && <span>Préc. {e.previous}</span>}
                    </span>
                    <span className="col-span-3 sm:col-span-1">
                      <ImpactBadge impact={e.impact} />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
