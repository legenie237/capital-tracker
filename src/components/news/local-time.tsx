"use client";

import { useEffect, useState } from "react";

/** Affiche une date à l'heure locale du navigateur (évite l'heure du serveur). */
export function LocalTime({ iso }: { iso: string }) {
  const [text, setText] = useState<string | null>(null);
  useEffect(() => {
    setText(new Date(iso).toLocaleString("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }));
  }, [iso]);
  return <span suppressHydrationWarning>{text ?? "…"}</span>;
}
