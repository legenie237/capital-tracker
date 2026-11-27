import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/supabase/session";
import { TradeForm } from "@/components/trades/trade-form";

export default async function NewTradePage() {
  const supabase = await createClient();
  const user = await getSessionUser();
  if (!user) redirect("/connexion");
  const { data } = await supabase.from("trades").select("setup").not("setup", "is", null).limit(500);
  const setups = [...new Set((data ?? []).map((r) => r.setup as string))].sort();

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-2xl font-semibold">Nouveau trade</h1>
      <TradeForm userId={user.id} knownSetups={setups} />
    </div>
  );
}
