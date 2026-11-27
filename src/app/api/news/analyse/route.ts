import Anthropic from "@anthropic-ai/sdk";
import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { accessOf, hasAccess } from "@/lib/billing";
import { COACH_MODEL } from "@/lib/coach/limits";
import { fetchCalendar, type EconEvent } from "@/lib/news/calendar";
import { NEWS_SYSTEM, newsPrompt } from "@/lib/news/prompt";
import type { Profile } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

async function analyse(event: EconEvent) {
  const client = new Anthropic();
  const msg = await client.beta.messages.create({
    model: COACH_MODEL,
    max_tokens: 6000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: NEWS_SYSTEM,
    messages: [{ role: "user", content: newsPrompt(event) }],
  });
  if (msg.stop_reason === "refusal") throw new Error("refusal");
  const text = msg.content.map((b) => (b.type === "text" ? b.text : "")).join("").trim();
  if (!text) throw new Error("empty");
  return { text, at: new Date().toISOString() };
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Connecte-toi pour voir l'analyse." }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, subscription_until, created_at")
    .eq("id", user.id)
    .single<Pick<Profile, "role" | "subscription_until" | "created_at">>();
  if (!profile || !hasAccess(accessOf(profile))) {
    return Response.json({ error: "L'analyse IA des news est réservée aux abonnés (2 500 FCFA/mois)." }, { status: 402 });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "L'analyse IA n'est pas encore activée sur ce site." }, { status: 503 });
  }

  const id = new URL(request.url).searchParams.get("id") ?? "";
  const { events } = await fetchCalendar();
  const event = events.find((e) => e.id === id);
  if (!event) return Response.json({ error: "Cette news n'est plus dans le calendrier de la semaine." }, { status: 404 });

  // Une seule analyse par news et par résultat publié, partagée entre tous les traders (cache 24 h)
  const cached = unstable_cache(() => analyse(event), ["news-analysis", event.id, event.actual ?? "-"], {
    revalidate: 86400,
  });
  try {
    return Response.json(await cached());
  } catch (err) {
    console.error("news analyse", err);
    return Response.json({ error: "L'analyse n'a pas pu être générée. Réessaie dans un instant." }, { status: 502 });
  }
}
