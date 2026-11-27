"use client";

import { useState } from "react";

type Point = { date: string; value: number };

const W = 800;
const H = 240;
const PAD = { top: 16, right: 16, bottom: 28, left: 64 };

function fmt(n: number) {
  return n.toLocaleString("fr-FR", { maximumFractionDigits: 2 });
}

/** Courbe d'équité cumulée (une seule série) avec réticule et info-bulle au survol. */
export function EquityChart({ points }: { points: Point[] }) {
  const [hover, setHover] = useState<number | null>(null);
  if (points.length < 2) {
    return <p className="text-sm text-muted">La courbe apparaîtra à partir de 2 trades clôturés.</p>;
  }

  const series = [{ date: points[0].date, value: 0 }, ...points];
  const values = series.map((p) => p.value);
  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values);
  const span = max - min || 1;
  const iw = W - PAD.left - PAD.right;
  const ih = H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (i / (series.length - 1)) * iw;
  const y = (v: number) => PAD.top + (1 - (v - min) / span) * ih;
  const path = series.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  const ticks = [min, min + span / 2, max];

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const i = Math.round(((px - PAD.left) / iw) * (series.length - 1));
    setHover(Math.max(0, Math.min(series.length - 1, i)));
  }

  const h = hover !== null ? series[hover] : null;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full touch-none"
        role="img"
        aria-label={`Courbe d'équité : ${fmt(values[values.length - 1])} après ${points.length} trades`}
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeWidth={1} />
            <text x={PAD.left - 8} y={y(t) + 4} textAnchor="end" fontSize={12} fill="var(--muted)">
              {fmt(t)}
            </text>
          </g>
        ))}
        <line x1={PAD.left} x2={W - PAD.right} y1={y(0)} y2={y(0)} stroke="var(--muted)" strokeWidth={1} strokeDasharray="4 4" />
        <path d={path} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        <text x={PAD.left} y={H - 6} fontSize={12} fill="var(--muted)">Trade 1</text>
        <text x={W - PAD.right} y={H - 6} fontSize={12} fill="var(--muted)" textAnchor="end">Trade {points.length}</text>
        {h && hover !== null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={H - PAD.bottom} stroke="var(--muted)" strokeWidth={1} />
            <circle cx={x(hover)} cy={y(h.value)} r={5} fill="var(--accent)" stroke="var(--surface)" strokeWidth={2} />
          </g>
        )}
      </svg>
      {h && hover !== null && (
        <div
          className="pointer-events-none absolute top-0 rounded-lg border border-border bg-background px-3 py-2 text-xs shadow"
          style={{ left: `${(x(hover) / W) * 100}%`, transform: `translateX(${hover > series.length / 2 ? "-105%" : "5%"})` }}
        >
          <div className="text-muted">{hover === 0 ? "Départ" : `Trade ${hover} · ${new Date(h.date).toLocaleDateString("fr-FR")}`}</div>
          <div className="font-semibold tabular-nums">{fmt(h.value)}</div>
        </div>
      )}
    </div>
  );
}
