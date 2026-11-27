"use client";

import { useActionState, useEffect, useState } from "react";
import { saveTrade } from "@/app/(app)/trades/actions";
import { Button, Card, FormMessage } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { EMOTIONS, MISTAKES, SESSIONS } from "@/lib/trades";
import type { Trade } from "@/lib/types";

const inputCls =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-accent";

function toLocalInput(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function L({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block space-y-1 text-sm ${className}`}>
      <span className="text-muted">{label}</span>
      {children}
    </label>
  );
}

type Shot = { path: string; url: string };

export function TradeForm({
  trade,
  userId,
  existingShots = [],
  knownSetups = [],
}: {
  trade?: Trade;
  userId: string;
  existingShots?: Shot[];
  knownSetups?: string[];
}) {
  const [state, action, pending] = useActionState(saveTrade, undefined);
  const [status, setStatus] = useState<"open" | "closed">(trade?.status ?? "closed");
  const [tz, setTz] = useState(0);
  const [openedAt, setOpenedAt] = useState("");
  const [closedAt, setClosedAt] = useState("");
  const [shots, setShots] = useState<Shot[]>(existingShots);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Les dates sont affichées dans le fuseau horaire du navigateur
  useEffect(() => {
    setTz(new Date().getTimezoneOffset());
    setOpenedAt(toLocalInput(trade?.opened_at ?? new Date().toISOString()));
    setClosedAt(toLocalInput(trade?.closed_at ?? (trade ? null : new Date().toISOString())));
  }, [trade]);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setUploadError(null);
    const supabase = createClient();
    const added: Shot[] = [];
    for (const file of Array.from(files)) {
      if (file.size > 5 * 1024 * 1024) {
        setUploadError(`${file.name} dépasse 5 Mo.`);
        continue;
      }
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("captures").upload(path, file, { contentType: file.type });
      if (error) {
        setUploadError("Envoi impossible : " + error.message);
        continue;
      }
      const { data } = await supabase.storage.from("captures").createSignedUrl(path, 3600);
      added.push({ path, url: data?.signedUrl ?? "" });
    }
    setShots((s) => [...s, ...added]);
    setUploading(false);
  }

  return (
    <Card>
      <form action={action} className="space-y-6">
        {trade && <input type="hidden" name="id" value={trade.id} />}
        <input type="hidden" name="tz" value={tz} />
        <input type="hidden" name="screenshots" value={JSON.stringify(shots.map((s) => s.path))} />

        <div className="grid gap-4 sm:grid-cols-3">
          <L label="Instrument *">
            <input name="symbol" required defaultValue={trade?.symbol} placeholder="EURUSD" className={`${inputCls} uppercase`} />
          </L>
          <L label="Direction">
            <select name="direction" defaultValue={trade?.direction ?? "buy"} className={inputCls}>
              <option value="buy">Achat (long)</option>
              <option value="sell">Vente (short)</option>
            </select>
          </L>
          <L label="Statut">
            <select name="status" value={status} onChange={(e) => setStatus(e.target.value as "open" | "closed")} className={inputCls}>
              <option value="closed">Clôturé</option>
              <option value="open">En cours</option>
            </select>
          </L>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <L label="Entrée le">
            <input type="datetime-local" name="opened_at" value={openedAt} onChange={(e) => setOpenedAt(e.target.value)} className={inputCls} />
          </L>
          {status === "closed" && (
            <L label="Sortie le">
              <input type="datetime-local" name="closed_at" value={closedAt} onChange={(e) => setClosedAt(e.target.value)} className={inputCls} />
            </L>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <L label="Prix d'entrée *">
            <input name="entry_price" inputMode="decimal" required defaultValue={trade?.entry_price ?? ""} className={inputCls} />
          </L>
          {status === "closed" && (
            <L label="Prix de sortie">
              <input name="exit_price" inputMode="decimal" defaultValue={trade?.exit_price ?? ""} className={inputCls} />
            </L>
          )}
          <L label="Stop loss">
            <input name="stop_loss" inputMode="decimal" defaultValue={trade?.stop_loss ?? ""} className={inputCls} />
          </L>
          <L label="Take profit">
            <input name="take_profit" inputMode="decimal" defaultValue={trade?.take_profit ?? ""} className={inputCls} />
          </L>
          <L label="Taille (lots)">
            <input name="lot_size" inputMode="decimal" defaultValue={trade?.lot_size ?? ""} className={inputCls} />
          </L>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {status === "closed" && (
            <L label="Résultat (+ gain / − perte) *">
              <input name="pnl" inputMode="decimal" required defaultValue={trade?.pnl ?? ""} placeholder="-25.50" className={inputCls} />
            </L>
          )}
          <L label="Frais / commissions">
            <input name="fees" inputMode="decimal" defaultValue={trade?.fees || ""} className={inputCls} />
          </L>
          <L label="Montant risqué (pour le R)">
            <input name="risk_amount" inputMode="decimal" defaultValue={trade?.risk_amount ?? ""} className={inputCls} />
          </L>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <L label="Session">
            <select name="session" defaultValue={trade?.session ?? ""} className={inputCls}>
              <option value="">–</option>
              {SESSIONS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </L>
          <L label="Setup / stratégie">
            <input name="setup" list="setups" defaultValue={trade?.setup ?? ""} placeholder="Cassure, pullback, range…" className={inputCls} />
            <datalist id="setups">
              {knownSetups.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </L>
        </div>

        <fieldset className="space-y-2 text-sm">
          <legend className="mb-1 text-muted">Émotions pendant le trade</legend>
          <div className="flex flex-wrap gap-2">
            {EMOTIONS.map((e) => (
              <label key={e} className="flex cursor-pointer items-center gap-1 rounded-full border border-border px-3 py-1 has-[:checked]:border-accent has-[:checked]:text-accent">
                <input type="checkbox" name="emotions" value={e} defaultChecked={trade?.emotions?.includes(e)} className="sr-only" />
                {e}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-2 text-sm">
          <legend className="mb-1 text-muted">Erreurs commises (pour mesurer ce qu&apos;elles vous coûtent)</legend>
          <div className="flex flex-wrap gap-2">
            {MISTAKES.map((m) => (
              <label key={m} className="flex cursor-pointer items-center gap-1 rounded-full border border-border px-3 py-1 has-[:checked]:border-danger has-[:checked]:text-danger">
                <input type="checkbox" name="mistakes" value={m} defaultChecked={trade?.mistakes?.includes(m)} className="sr-only" />
                {m}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-2 text-sm">
          <legend className="mb-1 text-muted">Plan de trading respecté ?</legend>
          <div className="flex gap-4">
            {[
              ["oui", "Oui", trade?.followed_plan === true],
              ["non", "Non", trade?.followed_plan === false],
              ["", "Non renseigné", trade ? trade.followed_plan === null : true],
            ].map(([v, label, checked]) => (
              <label key={String(v)} className="flex items-center gap-2">
                <input type="radio" name="followed_plan" value={String(v)} defaultChecked={Boolean(checked)} />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        <L label="Notes (raison d'entrée, ce qui s'est passé, leçon retenue)">
          <textarea name="notes" rows={4} defaultValue={trade?.notes ?? ""} className={inputCls} />
        </L>

        <div className="space-y-2 text-sm">
          <span className="text-muted">Captures d&apos;écran (PNG, JPG, WebP, 5 Mo max)</span>
          <div className="flex flex-wrap gap-3">
            {shots.map((s) => (
              <div key={s.path} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.url} alt="Capture du trade" className="h-24 w-36 rounded-lg border border-border object-cover" />
                <button
                  type="button"
                  onClick={() => setShots((all) => all.filter((x) => x.path !== s.path))}
                  className="absolute right-1 top-1 rounded bg-black/70 px-2 text-xs text-white"
                  aria-label="Retirer la capture"
                >
                  ✕
                </button>
              </div>
            ))}
            <label className="flex h-24 w-36 cursor-pointer items-center justify-center rounded-lg border border-dashed border-border text-muted hover:border-accent">
              {uploading ? "Envoi…" : "+ Ajouter"}
              <input type="file" accept="image/png,image/jpeg,image/webp" multiple className="sr-only" onChange={(e) => onFiles(e.target.files)} />
            </label>
          </div>
          {uploadError && <p className="text-danger">{uploadError}</p>}
        </div>

        <FormMessage state={state} />
        <Button disabled={pending || uploading} className="sm:w-auto">
          {pending ? "Enregistrement…" : trade ? "Enregistrer les modifications" : "Ajouter le trade"}
        </Button>
      </form>
    </Card>
  );
}
