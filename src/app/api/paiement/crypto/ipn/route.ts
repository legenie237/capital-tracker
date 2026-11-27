import { createAdminClient } from "@/lib/supabase/admin";
import { USD_PER_MONTH } from "@/lib/billing";
import { cryptoEnabled, verifyIpnSignature } from "@/lib/payments/nowpayments";

export const runtime = "nodejs";

/** Notification de NOWPayments : active l'abonnement quand le paiement est terminé. */
export async function POST(request: Request) {
  if (!cryptoEnabled()) return new Response("disabled", { status: 503 });
  const body = await request.json().catch(() => null);
  if (!body || !verifyIpnSignature(body, request.headers.get("x-nowpayments-sig"), process.env.NOWPAYMENTS_IPN_SECRET!)) {
    return new Response("bad signature", { status: 401 });
  }

  const orderId = String(body.order_id ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) return new Response("bad order", { status: 400 });

  const admin = createAdminClient();
  const { data: payment } = await admin
    .from("payments")
    .select("id, months, status, method")
    .eq("id", orderId)
    .single();
  if (!payment || payment.method !== "crypto") return new Response("unknown order", { status: 404 });

  const status = String(body.payment_status ?? "");
  if (status === "finished") {
    const expected = Math.round(payment.months * USD_PER_MONTH * 100) / 100;
    const currency = String(body.price_currency ?? "").toLowerCase();
    if (currency !== "usd" || Number(body.price_amount) + 0.001 < expected) {
      console.error("ipn: montant inattendu", body.price_amount, body.price_currency, expected);
      return new Response("amount mismatch", { status: 400 });
    }
    const { error } = await admin.rpc("confirm_crypto_payment", {
      p_id: orderId,
      p_provider_id: String(body.payment_id ?? body.invoice_id ?? ""),
    });
    if (error) {
      console.error("ipn", error);
      return new Response("error", { status: 500 });
    }
  } else if (["failed", "expired", "refunded"].includes(status) && payment.status === "waiting_crypto") {
    await admin.from("payments").update({ status: "failed" }).eq("id", orderId);
  }
  return new Response("ok");
}
