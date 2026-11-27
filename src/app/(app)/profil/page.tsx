import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";
import { ProfileForm } from "./form";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single<Profile>();
  if (!profile) return <p className="text-danger">Profil introuvable.</p>;

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold">Mon profil</h1>
      <p className="text-sm text-muted">
        {user.email} · Abonnement : {profile.subscription_status === "active" ? "actif" : "inactif"} · Code parrain :{" "}
        <span className="font-mono text-foreground">{profile.referral_code}</span>
      </p>
      <ProfileForm profile={profile} />
    </div>
  );
}
