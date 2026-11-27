import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui";
import { PayPanel } from "@/components/billing/pay-panel";
import { STATUS_LABEL, accessOf, daysLeft, formatFcfa } from "@/lib/billing";
import { cryptoEnabled } from "@/lib/payments/nowpayments";
import type { Profile } from "@/lib/types";

export const metadata = { title: "Abonnement – Capital Tracker" };

const fmt = (d: Date | string) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

export default async function AbonnementPage({ searchParams }: { searchParams: Promise<{ crypto?: string }> }) {
  const { crypto } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const [{ data: profile }, { data: payments }] = await Promise.all([
    supabase.from("profiles").select("role, subscription_until, created_at").eq("id", user.id).single<Pick<Profile, "role" | "subscription_until" | "created_at">>(),
    supabase
      .from("payments")
      .select("id, method, operator, reference, months, amount_fcfa, status, admin_note, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);
  if (!profile) return <p className="text-danger">Profil introuvable.</p>;
  const access = accessOf(profile);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Abonnement</h1>
        <p className="text-muted">Une seule offre, toutes les fonctions : 2 500 FCFA par mois.</p>
      </div>

      {crypto === "ok" && (
        <p className="rounded-lg bg-accent/15 p-3 text-sm">
          Paiement crypto reçu par le prestataire. Ton abonnement s&apos;active dès la confirmation du réseau (quelques minutes).
        </p>
      )}

      <Card>
        <p className="text-sm text-muted">Ton statut</p>
        {access.kind === "admin" && <p className="mt-1 text-lg font-semibold">Administrateur : accès complet</p>}
        {access.kind === "subscribed" && (
          <p className="mt-1 text-lg font-semibold">
            Abonné jusqu&apos;au {fmt(access.until)} <span className="text-sm font-normal text-muted">({daysLeft(access.until)} jours)</span>
          </p>
        )}
        {access.kind === "trial" && (
          <p className="mt-1 text-lg font-semibold">
            Essai gratuit : encore {daysLeft(access.until)} jour(s) <span className="text-sm font-normal text-muted">(jusqu&apos;au {fmt(access.until)})</span>
          </p>
        )}
        {access.kind === "none" && <p className="mt-1 text-lg font-semibold text-danger">Pas d&apos;abonnement actif</p>}
        <p className="mt-2 text-sm text-muted">
          Un nouveau paiement s&apos;ajoute à la durée restante : tu ne perds aucun jour.
        </p>
      </Card>

      <PayPanel cryptoEnabled={cryptoEnabled()} />

      <Card>
        <h2 className="text-lg font-semibold">Mes paiements</h2>
        {payments?.length ? (
          <ul className="mt-3 divide-y divide-border text-sm">
            {payments.map((p) => (
              <li key={p.id} className="flex flex-wrap items-start justify-between gap-2 py-3">
                <div>
                  <p>
                    {formatFcfa(p.amount_fcfa)} · {p.months} mois ·{" "}
                    {p.method === "crypto" ? "Crypto" : p.operator === "mtn" ? "MTN MoMo" : "Orange Money"}
                  </p>
                  <p className="text-muted">
                    {fmt(p.created_at)}
                    {p.reference ? ` · réf. ${p.reference}` : ""}
                  </p>
                  {p.admin_note && <p className="mt-1 text-muted">Note : {p.admin_note}</p>}
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    p.status === "approved"
                      ? "bg-accent/15 text-accent"
                      : p.status === "rejected" || p.status === "failed"
                        ? "bg-danger/15 text-danger"
                        : "bg-border text-muted"
                  }`}
                >
                  {STATUS_LABEL[p.status] ?? p.status}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted">Aucun paiement pour l&apos;instant.</p>
        )}
      </Card>
    </div>
  );
}
