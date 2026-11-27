import Link from "next/link";
import { redirect } from "next/navigation";
import { getMyProfile, getSessionUser } from "@/lib/supabase/session";
import { signOut } from "../(auth)/actions";
import { accessOf, daysLeft } from "@/lib/billing";
import { SideNav, TabBar } from "@/components/app-nav";
import { Icons } from "@/components/icons";

function Logo() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2 font-bold tracking-tight">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-accent to-accent-2 text-black">
        <Icons.chart width={18} height={18} strokeWidth={2.4} />
      </span>
      <span>
        Capital <span className="text-gradient">Tracker</span>
      </span>
    </Link>
  );
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/connexion");

  const profile = await getMyProfile();
  const access = profile ? accessOf(profile) : null;
  const isAdmin = profile?.role === "admin";

  const plan =
    access?.kind === "admin"
      ? { label: "Administrateur", tone: "text-accent" }
      : access?.kind === "subscribed"
        ? { label: `Abonné · ${daysLeft(access.until)} j`, tone: "text-accent" }
        : access?.kind === "trial"
          ? { label: `Essai · ${daysLeft(access.until)} j restants`, tone: "text-amber-400" }
          : { label: "Essai terminé", tone: "text-danger" };

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[16rem_1fr]">
      {/* Barre latérale (ordinateur) */}
      <aside className="glass sticky top-0 hidden h-screen flex-col border-r border-white/5 p-4 lg:flex">
        <Logo />
        <div className="mt-8 flex-1">
          <SideNav isAdmin={isAdmin} />
        </div>
        <Link href="/abonnement" className="mb-3 block rounded-xl border border-white/5 bg-white/[0.03] p-3 text-xs hover:border-accent/40">
          <p className="text-muted">Ton offre</p>
          <p className={`mt-0.5 font-semibold ${plan.tone}`}>{plan.label}</p>
        </Link>
        <Link href="/a-propos" className="mb-2 block px-1 text-xs text-muted hover:text-foreground">
          À propos de Capital Tracker
        </Link>
        <div className="flex items-center justify-between gap-2 border-t border-white/5 pt-3 text-sm">
          <span className="truncate text-muted">@{profile?.username}</span>
          <form action={signOut}>
            <button className="flex items-center gap-1 text-muted hover:text-danger" title="Déconnexion">
              <Icons.logout width={16} height={16} /> Déconnexion
            </button>
          </form>
        </div>
      </aside>

      <div className="min-w-0">
        {/* Barre du haut (mobile) */}
        <header className="glass sticky top-0 z-30 flex items-center justify-between border-b border-white/5 px-4 py-3 lg:hidden">
          <Logo />
          <div className="flex items-center gap-3 text-sm">
            {isAdmin && (
              <Link href="/admin/paiements" className="text-accent">
                Admin
              </Link>
            )}
            <Link href="/abonnement" className={`text-xs ${plan.tone}`}>
              {plan.label}
            </Link>
          </div>
        </header>

        {access?.kind === "trial" && daysLeft(access.until) <= 3 && (
          <div className="border-b border-amber-500/20 bg-amber-500/10 px-4 py-2 text-center text-sm">
            Essai gratuit : encore {daysLeft(access.until)} jour(s).{" "}
            <Link href="/abonnement" className="font-semibold text-accent underline">
              S&apos;abonner (2 500 FCFA/mois)
            </Link>
          </div>
        )}
        {access?.kind === "none" && (
          <div className="border-b border-danger/20 bg-danger/10 px-4 py-2 text-center text-sm">
            Ton essai est terminé : le coach IA est en pause.{" "}
            <Link href="/abonnement" className="font-semibold underline">
              Réactiver pour 2 500 FCFA/mois
            </Link>
          </div>
        )}
        <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-10 lg:pt-8">{children}</main>
      </div>
      <TabBar />
    </div>
  );
}
