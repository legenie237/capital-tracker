"use client";

import { useRef, useState } from "react";
import { Card } from "@/components/ui";
import { Markdown } from "./markdown";

export type SavedReview = { id: string; created_at: string; content: string };
type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Quelle est mon erreur la plus coûteuse ?",
  "À quelle session je devrais arrêter de trader ?",
  "Mon risque par trade est-il raisonnable ?",
  "Comment éviter les trades de revanche ?",
];

async function ask(body: unknown, onText: (t: string) => void) {
  const res = await fetch("/api/coach", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok || !res.body) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error ?? "Le coach ne répond pas. Réessaie plus tard.");
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let text = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    text += decoder.decode(value, { stream: true });
    onText(text);
  }
  return text;
}

function when(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" });
}

export function CoachView({
  reviews,
  left,
  demo = false,
}: {
  reviews: SavedReview[];
  left: { bilan: number; question: number };
  demo?: boolean;
}) {
  const [current, setCurrent] = useState<SavedReview | null>(reviews[0] ?? null);
  const [reviewText, setReviewText] = useState<string | null>(null);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [bilansLeft, setBilansLeft] = useState(left.bilan);

  const [chat, setChat] = useState<Msg[]>([]);
  const [question, setQuestion] = useState("");
  const [chatBusy, setChatBusy] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [questionsLeft, setQuestionsLeft] = useState(left.question);
  const bottom = useRef<HTMLDivElement>(null);

  async function generate() {
    if (demo) return;
    setReviewBusy(true);
    setReviewError(null);
    setReviewText("");
    try {
      const text = await ask({ mode: "bilan" }, setReviewText);
      setCurrent({ id: "nouveau", created_at: new Date().toISOString(), content: text });
      setBilansLeft((n) => Math.max(0, n - 1));
    } catch (e) {
      setReviewError((e as Error).message);
    } finally {
      setReviewText(null);
      setReviewBusy(false);
    }
  }

  async function send(q: string) {
    const content = q.trim();
    if (!content || chatBusy || demo) return;
    const history: Msg[] = [...chat, { role: "user", content }];
    setChat([...history, { role: "assistant", content: "" }]);
    setQuestion("");
    setChatBusy(true);
    setChatError(null);
    try {
      await ask({ mode: "question", messages: history }, (t) => {
        setChat([...history, { role: "assistant", content: t }]);
        bottom.current?.scrollIntoView({ block: "nearest" });
      });
      setQuestionsLeft((n) => Math.max(0, n - 1));
    } catch (e) {
      setChat(history.slice(0, -1));
      setQuestion(content);
      setChatError((e as Error).message);
    } finally {
      setChatBusy(false);
    }
  }

  const shown = reviewText ?? current?.content ?? null;

  return (
    <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Bilan de la semaine</h2>
            <p className="text-sm text-muted">
              {reviewBusy
                ? "Le coach analyse tes trades…"
                : current
                  ? `Généré le ${when(current.created_at)}`
                  : "Le coach lit tes 7 derniers jours de trading et te donne un plan."}
            </p>
          </div>
          <button
            onClick={generate}
            disabled={reviewBusy || bilansLeft <= 0 || demo}
            className="rounded-lg bg-accent px-4 py-2 font-semibold text-black hover:opacity-90 disabled:opacity-50"
          >
            {reviewBusy ? "Analyse en cours…" : current ? "Nouveau bilan" : "Générer mon bilan"}
          </button>
        </div>
        {!demo && <p className="mt-2 text-xs text-muted">Bilans restants aujourd&apos;hui : {bilansLeft}</p>}
        {reviewError && <p className="mt-4 rounded-lg bg-danger/10 p-3 text-sm text-danger">{reviewError}</p>}
        <div className="mt-4">
          {shown ? (
            <Markdown text={shown || "…"} />
          ) : (
            <p className="text-muted">Aucun bilan pour l&apos;instant.</p>
          )}
        </div>
        {reviews.length > 1 && !reviewBusy && (
          <details className="mt-6 text-sm">
            <summary className="cursor-pointer text-muted">Bilans précédents</summary>
            <ul className="mt-2 space-y-1">
              {reviews.map((r) => (
                <li key={r.id}>
                  <button
                    onClick={() => setCurrent(r)}
                    className={r.id === current?.id ? "text-accent" : "text-muted hover:text-foreground"}
                  >
                    {when(r.created_at)}
                  </button>
                </li>
              ))}
            </ul>
          </details>
        )}
      </Card>

      <Card>
        <h2 className="text-lg font-semibold">Pose ta question</h2>
        <p className="text-sm text-muted">Le coach répond à partir de tes 30 derniers jours de trading.</p>
        <div className="mt-4 max-h-[28rem] space-y-3 overflow-y-auto">
          {chat.length === 0 && (
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  disabled={demo}
                  className="rounded-full border border-border px-3 py-1 text-left text-sm text-muted hover:border-accent hover:text-foreground disabled:opacity-60"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          {chat.map((m, i) =>
            m.role === "user" ? (
              <p key={i} className="ml-8 rounded-lg bg-accent/15 p-3 text-sm">
                {m.content}
              </p>
            ) : (
              <div key={i} className="mr-4 rounded-lg border border-border p-3 text-sm">
                {m.content ? <Markdown text={m.content} /> : <span className="text-muted">Le coach réfléchit…</span>}
              </div>
            ),
          )}
          <div ref={bottom} />
        </div>
        {chatError && <p className="mt-3 rounded-lg bg-danger/10 p-3 text-sm text-danger">{chatError}</p>}
        <form
          className="mt-4 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            send(question);
          }}
        >
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            maxLength={2000}
            disabled={demo}
            placeholder={demo ? "Crée un compte pour discuter avec le coach" : "Ex. : pourquoi je perds le vendredi ?"}
            className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <button
            disabled={chatBusy || !question.trim() || questionsLeft <= 0 || demo}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
          >
            Envoyer
          </button>
        </form>
        {!demo && <p className="mt-2 text-xs text-muted">Questions restantes aujourd&apos;hui : {questionsLeft}</p>}
      </Card>
    </div>
  );
}
