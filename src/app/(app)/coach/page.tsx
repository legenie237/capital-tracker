import { createClient } from "@/lib/supabase/server";
import { getMyProfile } from "@/lib/supabase/session";
import { CoachView, type SavedReview } from "@/components/coach/coach-view";
import { COACH_LIMITS } from "@/lib/coach/limits";
import Link from "next/link";
import { Card } from "@/components/ui";
import { accessOf, hasAccess } from "@/lib/billing";

export const metadata = { title: "Coach IA – Capital Tracker" };

export default async function CoachPage() {
  const supabase = await createClient();
  const profile = await getMyProfile();
  if (!profile || !hasAccess(accessOf(profile))) {
    return (
      <div className="max-w-xl space-y-6">
        <h1 className="text-2xl font-semibold">Coach IA</h1>
        <Card className="space-y-3">
          <p className="text-lg font-semibold">Le coach IA est réservé aux abonnés.</p>
          <p className="text-muted">
            Ton essai gratuit est terminé. Abonne-toi pour 2 500 FCFA/mois et retrouve ton bilan de la semaine et tes questions au coach.
          </p>
          <Link href="/abonnement" className="inline-block rounded-lg bg-accent px-4 py-2 font-semibold text-black">
            Voir l&apos;abonnement
          </Link>
        </Card>
      </div>
    );
  }
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
