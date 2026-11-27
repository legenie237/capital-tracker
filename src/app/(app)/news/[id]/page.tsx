import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui";
import { AnalysisView } from "@/components/news/analysis-view";
import { ImpactBadge } from "@/components/news/calendar-view";
import { LocalTime } from "@/components/news/local-time";
import { PAIRS, fetchCalendar } from "@/lib/news/calendar";

export default async function NewsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { events } = await fetchCalendar();
  const event = events.find((e) => e.id === id);
  if (!event) notFound();
  const pairs = PAIRS[event.currency] ?? [];

  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/news" className="text-sm text-muted hover:text-foreground">
        ← Calendrier
      </Link>
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-lg bg-surface px-2 py-1 font-mono text-sm">{event.currency}</span>
          <ImpactBadge impact={event.impact} />
        </div>
        <h1 className="text-2xl font-semibold">{event.title}</h1>
        <p className="text-muted">
          <LocalTime iso={event.date} />
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          ["Prévision", event.forecast],
          ["Précédent", event.previous],
          ["Réel", event.actual],
        ].map(([label, v]) => (
          <Card key={label} className="!p-4 text-center">
            <p className="text-xs text-muted">{label}</p>
            <p className="mt-1 font-mono text-xl">{v ?? "–"}</p>
          </Card>
        ))}
      </div>

      {pairs.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted">Paires à surveiller :</span>
          {pairs.map((p) => (
            <span key={p} className="rounded-full border border-border px-2 py-0.5 font-mono text-xs">
              {p}
            </span>
          ))}
        </div>
      )}

      <Card>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
          <span className="rounded-md bg-accent/15 px-2 py-0.5 text-xs font-bold text-accent">IA</span>
          Analyse et scénarios
        </h2>
        <AnalysisView id={event.id} />
      </Card>
      <p className="text-xs text-muted">
        Analyse éducative, pas un conseil d&apos;investissement. Les marchés peuvent réagir à l&apos;inverse des scénarios.
      </p>
    </div>
  );
}
