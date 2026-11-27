"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Markdown } from "@/components/coach/markdown";

export function AnalysisView({ id }: { id: string }) {
  const [state, setState] = useState<{ text?: string; error?: string; status?: number } | null>(null);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let alive = true;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    fetch(`/api/news/analyse?id=${encodeURIComponent(id)}`)
      .then(async (r) => ({ status: r.status, data: await r.json().catch(() => null) }))
      .then(({ status, data }) => alive && setState(data?.text ? { text: data.text } : { error: data?.error ?? "Erreur.", status }))
      .catch(() => alive && setState({ error: "Connexion impossible." }))
      .finally(() => clearInterval(t));
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [id]);

  if (!state) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3 text-muted">
          <span className="inline-block h-3 w-3 animate-ping rounded-full bg-accent" />
          L&apos;IA analyse cette news… {seconds} s
        </div>
        {[80, 95, 60, 90, 70].map((w, i) => (
          <div key={i} className="h-3 animate-pulse rounded bg-border" style={{ width: `${w}%` }} />
        ))}
        <p className="text-xs text-muted">La première analyse prend environ 30 secondes, puis elle est instantanée pour tout le monde.</p>
      </div>
    );
  }
  if (state.error) {
    return (
      <div className="space-y-3">
        <p className="text-danger">{state.error}</p>
        {state.status === 402 && (
          <Link href="/abonnement" className="inline-block rounded-lg bg-accent px-4 py-2 font-semibold text-black">
            Voir l&apos;abonnement
          </Link>
        )}
      </div>
    );
  }
  return <Markdown text={state.text!} />;
}
