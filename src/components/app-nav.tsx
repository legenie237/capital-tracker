"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icons, type IconName } from "./icons";

export const NAV: { href: string; label: string; short: string; icon: IconName }[] = [
  { href: "/dashboard", label: "Tableau de bord", short: "Accueil", icon: "dashboard" },
  { href: "/trades", label: "Journal", short: "Journal", icon: "journal" },
  { href: "/news", label: "Calendrier éco", short: "News", icon: "news" },
  { href: "/coach", label: "Coach IA", short: "Coach", icon: "coach" },
  { href: "/abonnement", label: "Abonnement", short: "Abonnement", icon: "card" },
  { href: "/profil", label: "Profil", short: "Profil", icon: "user" },
];

const isActive = (path: string, href: string) => path === href || path.startsWith(href + "/");

export function SideNav({ isAdmin }: { isAdmin: boolean }) {
  const path = usePathname();
  const items = isAdmin ? [...NAV, { href: "/admin/paiements", label: "Admin", short: "Admin", icon: "shield" as IconName }] : NAV;
  return (
    <nav className="space-y-1">
      {items.map((item) => {
        const Icon = Icons[item.icon];
        const active = isActive(path, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
              active ? "bg-accent/15 text-foreground shadow-[inset_2px_0_0_var(--accent)]" : "text-muted hover:bg-white/5 hover:text-foreground"
            }`}
          >
            <Icon className={active ? "text-accent" : ""} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Barre d'onglets en bas de l'écran sur mobile. */
export function TabBar() {
  const path = usePathname();
  const items = NAV.filter((n) => ["/dashboard", "/trades", "/news", "/coach", "/profil"].includes(n.href));
  return (
    <nav className="glass fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-white/5 pb-[env(safe-area-inset-bottom)] lg:hidden">
      {items.map((item) => {
        const Icon = Icons[item.icon];
        const active = isActive(path, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-0.5 py-2 text-[11px] ${active ? "text-accent" : "text-muted"}`}
          >
            <Icon width={22} height={22} />
            {item.short}
          </Link>
        );
      })}
    </nav>
  );
}
