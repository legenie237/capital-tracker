import { redirect } from "next/navigation";
import { getMyProfile, getSessionUser } from "@/lib/supabase/session";
import { ProfileForm } from "./form";
import { accessOf } from "@/lib/billing";

export default async function ProfilePage() {
  const user = await getSessionUser();
  if (!user) redirect("/connexion");
  const profile = await getMyProfile();
  if (!profile) return <p className="text-danger">Profil introuvable.</p>;

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold">Mon profil</h1>
      <p className="text-sm text-muted">
        {user.email} · Abonnement :{" "}
        <a href="/abonnement" className="text-accent underline">
          {accessOf(profile).kind === "subscribed" ? "actif" : accessOf(profile).kind === "trial" ? "essai gratuit" : accessOf(profile).kind === "admin" ? "admin" : "inactif"}
        </a> · Code parrain :{" "}
        <span className="font-mono text-foreground">{profile.referral_code}</span>
      </p>
      <ProfileForm profile={profile} />
    </div>
  );
}
