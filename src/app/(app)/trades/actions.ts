"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "../../(auth)/actions";

function num(fd: FormData, key: string): number | null {
  const raw = String(fd.get(key) ?? "").trim().replace(",", ".");
  if (raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : NaN;
}

function text(fd: FormData, key: string): string | null {
  const v = String(fd.get(key) ?? "").trim();
  return v === "" ? null : v;
}

/** Convertit la valeur d'un champ datetime-local (heure locale du navigateur) en ISO UTC. */
function localDate(fd: FormData, key: string): string | null {
  const v = text(fd, key);
  if (!v) return null;
  const offsetMin = Number(fd.get("tz") ?? 0) || 0;
  const t = Date.parse(`${v}:00Z`) + offsetMin * 60_000;
  return Number.isFinite(t) ? new Date(t).toISOString() : null;
}

export async function saveTrade(_: FormState, fd: FormData): Promise<FormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Session expirée, reconnectez-vous." };

  const id = text(fd, "id");
  const status = fd.get("status") === "open" ? "open" : "closed";
  const direction = fd.get("direction") === "sell" ? "sell" : "buy";
  const symbol = (text(fd, "symbol") ?? "").toUpperCase().replace(/\s+/g, "");

  const numbers = {
    entry_price: num(fd, "entry_price"),
    exit_price: num(fd, "exit_price"),
    stop_loss: num(fd, "stop_loss"),
    take_profit: num(fd, "take_profit"),
    lot_size: num(fd, "lot_size"),
    pnl: num(fd, "pnl"),
    fees: num(fd, "fees"),
    risk_amount: num(fd, "risk_amount"),
  };

  if (!symbol) return { error: "Indiquez l'instrument (ex. EURUSD, XAUUSD, BTCUSDT)." };
  if (Object.values(numbers).some((n) => Number.isNaN(n))) return { error: "Un des montants n'est pas un nombre valide." };
  if (numbers.entry_price === null) return { error: "Indiquez le prix d'entrée." };
  if (status === "closed" && numbers.pnl === null) return { error: "Indiquez le résultat (gain ou perte) du trade clôturé." };
  if (numbers.risk_amount !== null && numbers.risk_amount < 0) return { error: "Le montant risqué doit être positif." };

  const opened_at = localDate(fd, "opened_at") ?? new Date().toISOString();
  const closed_at = status === "closed" ? (localDate(fd, "closed_at") ?? opened_at) : null;
  if (closed_at && closed_at < opened_at) return { error: "La date de sortie est avant la date d'entrée." };

  let screenshots: string[] = [];
  try {
    const parsed = JSON.parse(String(fd.get("screenshots") ?? "[]"));
    // On n'accepte que des fichiers du dossier de l'utilisateur
    screenshots = Array.isArray(parsed) ? parsed.filter((p) => typeof p === "string" && p.startsWith(`${user.id}/`)) : [];
  } catch {
    screenshots = [];
  }

  const followed = fd.get("followed_plan");
  const row = {
    symbol,
    direction,
    status,
    ...numbers,
    fees: numbers.fees ?? 0,
    exit_price: status === "closed" ? numbers.exit_price : null,
    pnl: status === "closed" ? numbers.pnl : null,
    opened_at,
    closed_at,
    session: text(fd, "session"),
    setup: text(fd, "setup"),
    emotions: fd.getAll("emotions").map(String),
    followed_plan: followed === "oui" ? true : followed === "non" ? false : null,
    notes: text(fd, "notes"),
    screenshots,
  };

  const { error } = id
    ? await supabase.from("trades").update(row).eq("id", id)
    : await supabase.from("trades").insert(row);
  if (error) return { error: "Enregistrement impossible : " + error.message };

  revalidatePath("/trades");
  revalidatePath("/dashboard");
  redirect("/trades");
}

export async function deleteTrade(fd: FormData) {
  const id = String(fd.get("id") ?? "");
  const supabase = await createClient();
  const { data: trade } = await supabase.from("trades").select("screenshots").eq("id", id).single();
  await supabase.from("trades").delete().eq("id", id);
  if (trade?.screenshots?.length) await supabase.storage.from("captures").remove(trade.screenshots);
  revalidatePath("/trades");
  revalidatePath("/dashboard");
  redirect("/trades");
}
