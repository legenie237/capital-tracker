"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { MOBILE_MONEY, PLANS, PRICE_FCFA } from "@/lib/billing";

export type PayState = { error?: string; message?: string } | undefined;

export async function declareTransfer(_: PayState, formData: FormData): Promise<PayState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Session expirée, reconnecte-toi." };

  const months = Number(formData.get("months"));
  const operator = String(formData.get("operator") ?? "");
  const phone = String(formData.get("phone") ?? "").replace(/[\s.-]/g, "");
  const reference = String(formData.get("reference") ?? "").trim();

  if (!PLANS.includes(months as (typeof PLANS)[number])) return { error: "Choisis une durée." };
  if (!MOBILE_MONEY.operators.some((o) => o.id === operator)) return { error: "Choisis l'opérateur utilisé." };
  if (!/^\+?\d{8,15}$/.test(phone)) return { error: "Indique le numéro qui a envoyé l'argent (chiffres uniquement)." };
  if (reference.length < 4 || reference.length > 60) {
    return { error: "Indique la référence (ID) de la transaction reçue par SMS." };
  }

  const { error } = await supabase.from("payments").insert({
    method: "mobile_money",
    operator,
    phone,
    reference,
    months,
    amount_fcfa: months * PRICE_FCFA,
  });
  if (error?.code === "23505") return { error: "Cette référence de transaction a déjà été déclarée." };
  if (error?.code === "42501") {
    return { error: "Tu as déjà 3 demandes en attente. Attends leur validation avant d'en déclarer une autre." };
  }
  if (error) return { error: "Déclaration impossible. Réessaie." };

  revalidatePath("/abonnement");
  return { message: "Paiement déclaré ✅ Il sera validé sous 24 h maximum. Tu peux suivre son statut ci-dessous." };
}
