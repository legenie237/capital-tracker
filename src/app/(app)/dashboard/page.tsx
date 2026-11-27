import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DashboardView } from "@/components/dashboard-view";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("trades")
    .select("pnl, fees, risk_amount, status, opened_at, closed_at, symbol, setup, session, followed_plan, mistakes");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Tableau de bord</h1>
        <Link href="/trades/nouveau" className="rounded-lg bg-accent px-4 py-2 font-semibold text-black hover:opacity-90">
          + Nouveau trade
        </Link>
      </div>
      <DashboardView trades={data ?? []} newTradeHref="/trades/nouveau" />
    </div>
  );
}
