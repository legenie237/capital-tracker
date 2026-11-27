import type { Profile } from "./types";

export const PRICE_FCFA = 2500;
export const PLANS = [1, 3, 6, 12] as const;
export type PlanMonths = (typeof PLANS)[number];
export const TRIAL_DAYS = 7;
/** Prix d'un mois en dollars pour le paiement crypto (≈ 2 500 FCFA). */
export const USD_PER_MONTH = 4.17;

export const MOBILE_MONEY = {
  name: "Ngangni Samari Malachie",
  operators: [
    { id: "mtn", label: "MTN Mobile Money", number: "673492015" },
    { id: "orange", label: "Orange Money", number: "659703338" },
  ],
} as const;
export type OperatorId = (typeof MOBILE_MONEY.operators)[number]["id"];

export const STATUS_LABEL: Record<string, string> = {
  pending: "En attente de validation",
  approved: "Validé",
  rejected: "Refusé",
  waiting_crypto: "En attente du paiement crypto",
  failed: "Échoué",
};

export function formatFcfa(n: number) {
  return `${n.toLocaleString("fr-FR")} FCFA`;
}

export type Access =
  | { kind: "admin" }
  | { kind: "subscribed"; until: Date }
  | { kind: "trial"; until: Date }
  | { kind: "none" };

/** Droit d'accès aux fonctions payantes : admin, abonné, ou essai gratuit de 7 jours après l'inscription. */
export function accessOf(
  profile: Pick<Profile, "role" | "subscription_until" | "created_at">,
  now = new Date(),
): Access {
  if (profile.role === "admin") return { kind: "admin" };
  if (profile.subscription_until) {
    const until = new Date(profile.subscription_until);
    if (until > now) return { kind: "subscribed", until };
  }
  const trialEnd = new Date(new Date(profile.created_at).getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
  if (trialEnd > now) return { kind: "trial", until: trialEnd };
  return { kind: "none" };
}

export const hasAccess = (a: Access) => a.kind !== "none";

export function daysLeft(until: Date, now = new Date()) {
  return Math.max(0, Math.ceil((until.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));
}
