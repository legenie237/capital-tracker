import { createHmac, timingSafeEqual } from "node:crypto";

const API = process.env.NOWPAYMENTS_API_URL || "https://api.nowpayments.io/v1";

export function cryptoEnabled() {
  return Boolean(
    process.env.NOWPAYMENTS_API_KEY && process.env.NOWPAYMENTS_IPN_SECRET && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

/** Trie les clés d'un objet (récursivement), comme l'exige la signature NOWPayments. */
export function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value as Record<string, unknown>)
        .sort()
        .map((k) => [k, sortKeys((value as Record<string, unknown>)[k])]),
    );
  }
  return value;
}

/** Vérifie l'en-tête x-nowpayments-sig d'une notification IPN. */
export function verifyIpnSignature(body: unknown, signature: string | null, secret: string) {
  if (!signature) return false;
  const expected = createHmac("sha512", secret).update(JSON.stringify(sortKeys(body))).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature.trim().toLowerCase(), "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function createInvoice(params: {
  orderId: string;
  priceUsd: number;
  description: string;
  siteUrl: string;
}): Promise<{ id: string; invoice_url: string }> {
  const res = await fetch(`${API}/invoice`, {
    method: "POST",
    headers: { "x-api-key": process.env.NOWPAYMENTS_API_KEY!, "Content-Type": "application/json" },
    body: JSON.stringify({
      price_amount: params.priceUsd,
      price_currency: "usd",
      order_id: params.orderId,
      order_description: params.description,
      ipn_callback_url: `${params.siteUrl}/api/paiement/crypto/ipn`,
      success_url: `${params.siteUrl}/abonnement?crypto=ok`,
      cancel_url: `${params.siteUrl}/abonnement?crypto=annule`,
    }),
  });
  if (!res.ok) throw new Error(`NOWPayments ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return { id: String(data.id), invoice_url: String(data.invoice_url) };
}
