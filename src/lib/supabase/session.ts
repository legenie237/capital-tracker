import { cache } from "react";
import { createClient } from "./server";
import type { Profile } from "@/lib/types";

/**
 * Utilisateur connecté, mis en cache pour toute la requête.
 * getClaims() vérifie le jeton localement (clés de signature asymétriques)
 * au lieu d'appeler le serveur d'authentification à chaque page.
 */
export const getSessionUser = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;
  return { id: claims.sub as string, email: (claims.email as string | undefined) ?? null };
});

/** Profil complet de l'utilisateur connecté, lu une seule fois par requête (layout + page). */
export const getMyProfile = cache(async () => {
  const user = await getSessionUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single<Profile>();
  return data;
});
