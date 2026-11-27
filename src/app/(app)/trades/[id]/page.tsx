import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TradeForm } from "@/components/trades/trade-form";
import { TRADE_COLUMNS } from "@/lib/trades";
import type { Trade } from "@/lib/types";
import { DeleteTradeButton } from "@/components/trades/delete-trade-button";

export default async function EditTradePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const { data: trade } = await supabase.from("trades").select(TRADE_COLUMNS).eq("id", id).maybeSingle<Trade>();
  if (!trade) notFound();

  let shots: { path: string; url: string }[] = [];
  if (trade.screenshots.length) {
    const { data } = await supabase.storage.from("captures").createSignedUrls(trade.screenshots, 3600);
    shots = (data ?? []).filter((d) => d.signedUrl && d.path).map((d) => ({ path: d.path!, url: d.signedUrl ?? "" }));
  }
  const { data: setupRows } = await supabase.from("trades").select("setup").not("setup", "is", null).limit(500);
  const setups = [...new Set((setupRows ?? []).map((r) => r.setup as string))].sort();

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">
          {trade.symbol} · {trade.direction === "buy" ? "Achat" : "Vente"}
        </h1>
        <DeleteTradeButton id={trade.id} />
      </div>
      <TradeForm trade={trade} userId={user.id} existingShots={shots} knownSetups={setups} />
    </div>
  );
}
