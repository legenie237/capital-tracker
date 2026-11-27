import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../(auth)/actions";
import { accessOf, daysLeft } from "@/lib/billing";
import type { Profile } from "@/lib/types";

const NAV = [
  { href: "/dashboard", label: "Tableau de bord" },
  { href: "/trades", label: "Journal" },
  { href: "/coach", label: "Coach IA" },
  { href: "/abonnement", label: "Abonnement" },
  { href: "/profil", label: "Profil" },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, role, subscription_until, created_at")
    .eq("id", user.id)
    .single<Pick<Profile, "username" | "role" | "subscription_until" | "created_at">>();
  const access = profile ? accessOf(profile) : null;

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/dashboard" className="font-bold">
            Capital <span className="text-accent">Tracker</span>
          </Link>
          <nav className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1 text-sm">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="text-muted hover:text-foreground">
                {item.label}
              </Link>
            ))}
            {profile?.role === "admin" && (
              <Link href="/admin/paiements" className="text-accent hover:underline">
                Admin
              </Link>
            )}
            <span className="hidden text-muted sm:inline">@{profile?.username}</span>
            <form action={signOut}>
              <button className="text-muted hover:text-danger">Déconnexion</button>
            </form>
          </nav>
        </div>
      </header>
      {access?.kind === "trial" && (
        <div className="bg-accent/15 px-4 py-2 text-center text-sm">
          Essai gratuit : encore {daysLeft(access.until)} jour(s).{" "}
          <Link href="/abonnement" className="font-semibold text-accent underline">
            S&apos;abonner (2 500 FCFA/mois)
          </Link>
        </div>
      )}
      {access?.kind === "none" && (
        <div className="bg-danger/15 px-4 py-2 text-center text-sm">
          Ton essai est terminé : le coach IA est en pause.{" "}
          <Link href="/abonnement" className="font-semibold underline">
            Réactiver pour 2 500 FCFA/mois
          </Link>
        </div>
      )}
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
