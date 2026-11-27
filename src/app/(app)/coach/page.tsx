import { createClient } from "@/lib/supabase/server";
import { CoachView, type SavedReview } from "@/components/coach/coach-view";
import { COACH_LIMITS } from "@/lib/coach/limits";

export const metadata = { title: "Coach IA – Capital Tracker" };

export default async function CoachPage() {
  const supabase = await createClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [{ data: reviews }, { data: usage }] = await Promise.all([
    supabase.from("coach_reviews").select("id, created_at, content").order("created_at", { ascending: false }).limit(10),
    supabase.from("coach_usage").select("kind").gte("created_at", since),
  ]);
  const used = (k: string) => (usage ?? []).filter((u) => u.kind === k).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Coach IA</h1>
        <p className="text-muted">
          Ton coach lit ton journal (résultats, erreurs, émotions, notes) et te dit quoi corriger en priorité.
        </p>
      </div>
      <CoachView
        reviews={(reviews ?? []) as SavedReview[]}
        left={{
          bilan: Math.max(0, COACH_LIMITS.bilan - used("bilan")),
          question: Math.max(0, COACH_LIMITS.question - used("question")),
        }}
      />
      <p className="text-xs text-muted">
        Le coach donne des conseils de méthode et de discipline, pas des conseils d&apos;investissement. Il peut se tromper :
        vérifie toujours avec tes propres chiffres.
      </p>
    </div>
  );
}
