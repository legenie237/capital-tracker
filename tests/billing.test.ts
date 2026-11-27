import { test } from "node:test";
import assert from "node:assert/strict";
import { accessOf, daysLeft, hasAccess } from "../src/lib/billing";

const NOW = new Date("2026-11-27T12:00:00Z");
const base = { role: "member" as const, subscription_until: null, created_at: "2026-11-01T00:00:00Z" };

test("essai gratuit de 7 jours après l'inscription", () => {
  const a = accessOf({ ...base, created_at: "2026-11-25T12:00:00Z" }, NOW);
  assert.equal(a.kind, "trial");
  assert.equal(daysLeft((a as { until: Date }).until, NOW), 5);
});

test("sans abonnement après l'essai : pas d'accès", () => {
  const a = accessOf(base, NOW);
  assert.equal(a.kind, "none");
  assert.equal(hasAccess(a), false);
});

test("abonnement actif puis expiré", () => {
  assert.equal(accessOf({ ...base, subscription_until: "2026-12-27T12:00:00Z" }, NOW).kind, "subscribed");
  assert.equal(accessOf({ ...base, subscription_until: "2026-11-26T12:00:00Z" }, NOW).kind, "none");
});

test("l'admin a toujours accès", () => {
  assert.equal(accessOf({ ...base, role: "admin" }, NOW).kind, "admin");
});

test("signature IPN NOWPayments : clés triées, HMAC-SHA512", async () => {
  const { createHmac } = await import("node:crypto");
  const { verifyIpnSignature } = await import("../src/lib/payments/nowpayments");
  const body = { payment_status: "finished", order_id: "abc", payment_id: 42, fee: { depositFee: 0, currency: "usdt" } };
  const sorted = '{"fee":{"currency":"usdt","depositFee":0},"order_id":"abc","payment_id":42,"payment_status":"finished"}';
  const sig = createHmac("sha512", "secret").update(sorted).digest("hex");
  assert.equal(verifyIpnSignature(body, sig, "secret"), true);
  assert.equal(verifyIpnSignature(body, sig, "autre"), false);
  assert.equal(verifyIpnSignature({ ...body, order_id: "xyz" }, sig, "secret"), false);
  assert.equal(verifyIpnSignature(body, null, "secret"), false);
});
