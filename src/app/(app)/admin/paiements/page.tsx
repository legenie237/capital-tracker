import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui";
import { ReviewForm } from "@/components/billing/review-row";
import { MOBILE_MONEY, STATUS_LABEL, formatFcfa } from "@/lib/billing";

export const metadata = { title: "Admin · Paiements – Capital Tracker" };

type Row = {
  id: string;
  method: string;
  operator: string | null;
  phone: string | null;
  reference: string | null;
  months: number;
  amount_fcfa: number;
  status: string;
  admin_note: string | null;
  created_at: string;
  profiles: { username: string } | null;
};

const when = (iso: string) => new Date(iso).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
const opLabel = (id: string | null) => MOBILE_MONEY.operators.find((o) => o.id === id)?.label ?? "Crypto";

export default async function AdminPaymentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "admin") notFound();

  const select = "id, method, operator, phone, reference, months, amount_fcfa, status, admin_note, created_at, profiles!payments_user_id_fkey(username)";
  const [{ data: pending }, { data: recent }] = await Promise.all([
    supabase.from("payments").select(select).eq("status", "pending").order("created_at").returns<Row[]>(),
    supabase.from("payments").select(select).neq("status", "pending").order("created_at", { ascending: false }).limit(30).returns<Row[]>(),
  ]);

  const total = (recent ?? []).filter((p) => p.status === "approved").reduce((s, p) => s + p.amount_fcfa, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin · Paiements</h1>
        <p className="text-muted">
          Vérifie chaque transfert sur ton téléphone (montant, numéro, référence) avant de valider.
        </p>
      </div>

      <Card>
        <h2 className="text-lg font-semibold">À valider ({pending?.length ?? 0})</h2>
        {pending?.length ? (
          <ul className="mt-3 divide-y divide-border">
            {pending.map((p) => (
              <li key={p.id} className="space-y-2 py-4 text-sm">
                <div className="flex flex-wrap justify-between gap-2">
                  <p>
                    <b>@{p.profiles?.username}</b> · {formatFcfa(p.amount_fcfa)} ({p.months} mois) · {opLabel(p.operator)}
                  </p>
                  <p className="text-muted">{when(p.created_at)}</p>
                </div>
                <p className="text-muted">
                  Numéro : <span className="font-mono text-foreground">{p.phone}</span> · Référence :{" "}
                  <span className="font-mono text-foreground">{p.reference}</span>
                </p>
                <ReviewForm id={p.id} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted">Aucun paiement en attente.</p>
        )}
      </Card>

      <Card>
        <h2 className="text-lg font-semibold">Derniers paiements traités</h2>
        <p className="text-sm text-muted">Total validé (30 derniers) : {formatFcfa(total)}</p>
        {recent?.length ? (
          <ul className="mt-3 divide-y divide-border text-sm">
            {recent.map((p) => (
              <li key={p.id} className="flex flex-wrap justify-between gap-2 py-3">
                <span>
                  @{p.profiles?.username} · {formatFcfa(p.amount_fcfa)} · {opLabel(p.operator)}
                  {p.reference ? ` · ${p.reference}` : ""}
                  {p.admin_note ? <span className="text-muted"> · {p.admin_note}</span> : null}
                </span>
                <span className={p.status === "approved" ? "text-accent" : "text-muted"}>{STATUS_LABEL[p.status]}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted">Rien pour l&apos;instant.</p>
        )}
      </Card>
    </div>
  );
}
