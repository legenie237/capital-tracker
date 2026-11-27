import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../(auth)/actions";

const NAV = [
  { href: "/dashboard", label: "Tableau de bord" },
  { href: "/trades", label: "Journal" },
  { href: "/coach", label: "Coach IA" },
  { href: "/profil", label: "Profil" },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const { data: profile } = await supabase.from("profiles").select("username").eq("id", user.id).single();

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
            <span className="hidden text-muted sm:inline">@{profile?.username}</span>
            <form action={signOut}>
              <button className="text-muted hover:text-danger">Déconnexion</button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
