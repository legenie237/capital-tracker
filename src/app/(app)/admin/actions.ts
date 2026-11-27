"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ReviewState = { error?: string; message?: string } | undefined;

export async function reviewPayment(_: ReviewState, formData: FormData): Promise<ReviewState> {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  const approve = formData.get("decision") === "approve";
  const note = String(formData.get("note") ?? "").slice(0, 500);
  if (!approve && !note.trim()) return { error: "Indique la raison du refus (le trader la verra)." };

  const { error } = await supabase.rpc("review_payment", { p_id: id, p_approve: approve, p_note: note });
  if (error) return { error: error.message.includes("déjà") ? "Ce paiement a déjà été traité." : "Action impossible : " + error.message };
  revalidatePath("/admin/paiements");
  return { message: approve ? "Validé : abonnement prolongé." : "Refusé." };
}
