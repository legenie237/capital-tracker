import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PLANS, PRICE_FCFA, USD_PER_MONTH } from "@/lib/billing";
import { createInvoice, cryptoEnabled } from "@/lib/payments/nowpayments";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!cryptoEnabled()) return Response.json({ error: "Le paiement crypto n'est pas encore activé." }, { status: 503 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Connecte-toi pour payer." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const months = Number(body?.months);
  if (!PLANS.includes(months as (typeof PLANS)[number])) {
    return Response.json({ error: "Durée d'abonnement invalide." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: payment, error } = await admin
    .from("payments")
    .insert({ user_id: user.id, method: "crypto", months, amount_fcfa: months * PRICE_FCFA, status: "waiting_crypto" })
    .select("id")
    .single();
  if (error || !payment) return Response.json({ error: "Impossible de créer le paiement." }, { status: 500 });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
  try {
    const invoice = await createInvoice({
      orderId: payment.id,
      priceUsd: Math.round(months * USD_PER_MONTH * 100) / 100,
      description: `Capital Tracker : abonnement ${months} mois`,
      siteUrl,
    });
    await admin.from("payments").update({ provider_id: invoice.id }).eq("id", payment.id);
    return Response.json({ url: invoice.invoice_url });
  } catch (err) {
    console.error("nowpayments", err);
    await admin.from("payments").update({ status: "failed" }).eq("id", payment.id);
    return Response.json({ error: "Le service crypto ne répond pas. Réessaie plus tard." }, { status: 502 });
  }
}
