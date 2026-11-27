"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error?: string; message?: string } | undefined;

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

async function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const h = await headers();
  return `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
}

function safeNext(value: FormDataEntryValue | null) {
  const v = typeof value === "string" ? value : "";
  return v.startsWith("/") && !v.startsWith("//") ? v : "/dashboard";
}

export async function signIn(_: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  });
  if (error) return { error: "Email ou mot de passe incorrect." };
  redirect(safeNext(formData.get("suite")));
}

export async function signUp(_: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const username = String(formData.get("username") ?? "").trim();

  if (!USERNAME_RE.test(username)) {
    return { error: "Le nom d'utilisateur doit faire 3 à 20 caractères (lettres, chiffres, _)." };
  }
  if (password.length < 8) return { error: "Le mot de passe doit faire au moins 8 caractères." };

  const supabase = await createClient();
  const { data: available, error: rpcError } = await supabase.rpc("username_available", { name: username });
  if (rpcError) return { error: "Impossible de vérifier le nom d'utilisateur. Réessayez." };
  if (!available) return { error: "Ce nom d'utilisateur est déjà pris." };

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username },
      emailRedirectTo: `${await siteUrl()}/auth/callback?suite=/dashboard`,
    },
  });
  if (error) return { error: "Inscription impossible : " + error.message };
  return { message: "Compte créé. Vérifiez votre boîte mail pour confirmer votre adresse." };
}

export async function requestPasswordReset(_: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(String(formData.get("email") ?? "").trim(), {
    redirectTo: `${await siteUrl()}/auth/callback?suite=/nouveau-mot-de-passe`,
  });
  // Même message dans tous les cas, pour ne pas révéler quels emails existent.
  return { message: "Si un compte existe pour cet email, un lien de réinitialisation vient d'être envoyé." };
}

export async function updatePassword(_: FormState, formData: FormData): Promise<FormState> {
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) return { error: "Le mot de passe doit faire au moins 8 caractères." };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: "Lien expiré ou invalide. Refaites une demande de réinitialisation." };
  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/connexion");
}
