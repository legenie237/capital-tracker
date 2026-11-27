import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { buildCoachContext, COACH_TRADE_COLUMNS, type CoachTrade } from "@/lib/coach/context";
import { CHAT_PROMPT, REVIEW_PROMPT } from "@/lib/coach/prompts";
import { accessOf, hasAccess } from "@/lib/billing";
import type { Profile } from "@/lib/types";
import { COACH_LIMITS, COACH_MODEL, MAX_HISTORY, MAX_QUESTION, type CoachKind } from "@/lib/coach/limits";

export const runtime = "nodejs";
export const maxDuration = 60;

type ChatMessage = { role: "user" | "assistant"; content: string };

const REFUSAL = "\n\n_Le coach ne peut pas répondre à cette demande. Essaie de la reformuler._";
const FAILURE = "\n\n_Le coach a rencontré un problème. Réessaie dans un instant._";

function fail(status: number, error: string) {
  return Response.json({ error }, { status });
}

function cleanHistory(raw: unknown): ChatMessage[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const msgs = raw.slice(-MAX_HISTORY).map((m) => ({
    role: m?.role === "assistant" ? ("assistant" as const) : ("user" as const),
    content: typeof m?.content === "string" ? m.content.slice(0, MAX_QUESTION * 2) : "",
  }));
  // L'historique doit commencer et finir par un message du trader.
  while (msgs.length && msgs[0].role !== "user") msgs.shift();
  const last = msgs[msgs.length - 1];
  if (!last || last.role !== "user" || !last.content.trim() || last.content.length > MAX_QUESTION) return null;
  return msgs.filter((m) => m.content.trim());
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail(401, "Connecte-toi pour utiliser le coach.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, subscription_until, created_at")
    .eq("id", user.id)
    .single<Pick<Profile, "role" | "subscription_until" | "created_at">>();
  if (!profile || !hasAccess(accessOf(profile))) {
    return fail(402, "Ton essai gratuit est terminé : abonne-toi (2 500 FCFA/mois) pour continuer avec le coach.");
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return fail(503, "Le coach IA n'est pas encore activé sur ce site (clé ANTHROPIC_API_KEY manquante).");
  }

  const body = await request.json().catch(() => null);
  const kind: CoachKind = body?.mode === "question" ? "question" : "bilan";
  const history = kind === "question" ? cleanHistory(body?.messages) : null;
  if (kind === "question" && !history) return fail(400, `Pose une question (${MAX_QUESTION} caractères maximum).`);

  // Limite d'usage sur 24 heures glissantes
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error: countError } = await supabase
    .from("coach_usage")
    .select("id", { count: "exact", head: true })
    .eq("kind", kind)
    .gte("created_at", since);
  if (countError) return fail(500, "Le coach n'est pas prêt : la migration 0005 doit être exécutée dans Supabase.");
  if ((count ?? 0) >= COACH_LIMITS[kind]) {
    return fail(
      429,
      kind === "bilan"
        ? `Tu as déjà généré ${COACH_LIMITS.bilan} bilans ces dernières 24 heures. Reviens demain.`
        : `Tu as atteint la limite de ${COACH_LIMITS.question} questions sur 24 heures. Reviens demain.`,
    );
  }

  const { data: trades, error: tradesError } = await supabase
    .from("trades")
    .select(COACH_TRADE_COLUMNS)
    .order("opened_at", { ascending: false })
    .limit(2000);
  if (tradesError) return fail(500, "Impossible de lire ton journal.");

  const ctx = buildCoachContext((trades ?? []) as CoachTrade[], new Date(), kind === "bilan" ? 7 : 30);
  if (kind === "bilan" && ctx.recentCount === 0) {
    return fail(400, "Aucun trade ces 7 derniers jours : ajoute ou importe des trades pour avoir un bilan.");
  }

  const { data: usage } = await supabase.from("coach_usage").insert({ kind }).select("id").single();

  const system = `${kind === "bilan" ? REVIEW_PROMPT : CHAT_PROMPT}\n\n<journal>\n${ctx.text}\n</journal>`;
  const messages: ChatMessage[] =
    history ?? [{ role: "user", content: "Fais-moi mon bilan de la semaine." }];

  const client = new Anthropic();
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let text = "";
      try {
        const reply = client.beta.messages.stream({
          model: COACH_MODEL,
          max_tokens: 8000,
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default",
          cache_control: { type: "ephemeral" },
          system,
          messages,
        });
        reply.on("text", (delta) => {
          text += delta;
          controller.enqueue(encoder.encode(delta));
        });
        const final = await reply.finalMessage();

        if (final.stop_reason === "refusal") {
          controller.enqueue(encoder.encode(REFUSAL));
        } else if (kind === "bilan" && text.trim()) {
          await supabase.from("coach_reviews").insert({
            period_start: ctx.since.toISOString(),
            period_end: ctx.until.toISOString(),
            content: text.slice(0, 40000),
          });
        }
        if (usage) {
          await supabase
            .from("coach_usage")
            .update({ input_tokens: final.usage.input_tokens, output_tokens: final.usage.output_tokens })
            .eq("id", usage.id);
        }
      } catch (err) {
        console.error("coach", err);
        controller.enqueue(encoder.encode(FAILURE));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}
