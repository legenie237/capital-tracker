"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "../../(auth)/actions";

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

export async function updateProfile(_: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Session expirée, reconnectez-vous." };

  const username = String(formData.get("username") ?? "").trim();
  if (!USERNAME_RE.test(username)) {
    return { error: "Le nom d'utilisateur doit faire 3 à 20 caractères (lettres, chiffres, _)." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      username,
      full_name: String(formData.get("full_name") ?? "").trim() || null,
      trading_goals: String(formData.get("trading_goals") ?? "").trim() || null,
      show_on_leaderboard: formData.get("show_on_leaderboard") === "on",
    })
    .eq("id", user.id);

  if (error?.code === "23505") return { error: "Ce nom d'utilisateur est déjà pris." };
  if (error) return { error: "Enregistrement impossible. Réessayez." };
  revalidatePath("/", "layout");
  return { message: "Profil enregistré." };
}
