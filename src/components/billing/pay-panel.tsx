"use client";

import { useActionState, useState } from "react";
import { declareTransfer } from "@/app/(app)/abonnement/actions";
import { Card, Field, FormMessage } from "@/components/ui";
import { MOBILE_MONEY, PLANS, PRICE_FCFA, USD_PER_MONTH, formatFcfa } from "@/lib/billing";
import { submitKeepingValues } from "@/lib/form";

export function PayPanel({ cryptoEnabled }: { cryptoEnabled: boolean }) {
  const [months, setMonths] = useState<number>(1);
  const [method, setMethod] = useState<"mobile_money" | "crypto">("mobile_money");
  const [operator, setOperator] = useState<string>(MOBILE_MONEY.operators[0].id);
  const [state, action, pending] = useActionState(declareTransfer, undefined);
  const [cryptoBusy, setCryptoBusy] = useState(false);
  const [cryptoError, setCryptoError] = useState<string | null>(null);
  const amount = months * PRICE_FCFA;
  const op = MOBILE_MONEY.operators.find((o) => o.id === operator)!;

  async function payCrypto() {
    setCryptoBusy(true);
    setCryptoError(null);
    const res = await fetch("/api/paiement/crypto", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ months }),
    });
    const data = await res.json().catch(() => null);
    if (res.ok && data?.url) {
      window.location.href = data.url;
      return;
    }
    setCryptoError(data?.error ?? "Erreur. Réessaie.");
    setCryptoBusy(false);
  }

  const tab = (active: boolean) =>
    `flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${active ? "border-accent bg-accent/15 text-foreground" : "border-border text-muted hover:text-foreground"}`;

  return (
    <Card className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">1. Choisis ta durée</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {PLANS.map((m) => (
            <button key={m} type="button" onClick={() => setMonths(m)} className={tab(months === m)}>
              <span className="block text-base">{m} mois</span>
              <span className="block text-xs text-muted">{formatFcfa(m * PRICE_FCFA)}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold">2. Choisis ton moyen de paiement</h2>
        <div className="mt-3 flex gap-3">
          <button type="button" onClick={() => setMethod("mobile_money")} className={tab(method === "mobile_money")}>
            Mobile Money
          </button>
          <button type="button" onClick={() => setMethod("crypto")} className={tab(method === "crypto")}>
            Crypto
          </button>
        </div>
      </div>

      {method === "mobile_money" ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-background p-4 text-sm">
            <p>
              Envoie <b className="text-accent">{formatFcfa(amount)}</b> au numéro <b>{op.label}</b> :
            </p>
            <p className="mt-2 font-mono text-2xl tracking-wider">{op.number}</p>
            <p className="mt-1 text-muted">Au nom de {MOBILE_MONEY.name}</p>
            <p className="mt-3 text-muted">
              Garde le SMS de confirmation : il contient la référence (ID) de la transaction à recopier ci-dessous.
            </p>
          </div>
          <form onSubmit={submitKeepingValues(action)} className="space-y-4">
            <input type="hidden" name="months" value={months} />
            <label className="block space-y-1 text-sm">
              <span className="text-muted">Opérateur utilisé</span>
              <select
                name="operator"
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-accent"
              >
                {MOBILE_MONEY.operators.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <Field label="Ton numéro (celui qui a envoyé l'argent)" name="phone" inputMode="tel" required placeholder="6XXXXXXXX" />
            <Field label="Référence / ID de la transaction" name="reference" required placeholder="Ex. : MP241127.1530.A12345" />
            <FormMessage state={state} />
            <button
              disabled={pending}
              className="w-full rounded-lg bg-accent px-4 py-2 font-semibold text-black hover:opacity-90 disabled:opacity-50"
            >
              {pending ? "Envoi…" : `J'ai payé ${formatFcfa(amount)}`}
            </button>
          </form>
        </div>
      ) : (
        <div className="space-y-4 text-sm">
          <p>
            Paiement en crypto (USDT, BTC, etc.) d&apos;environ <b className="text-accent">{(months * USD_PER_MONTH).toFixed(2)} $</b>.
            Ton abonnement s&apos;active automatiquement dès que le paiement est confirmé.
          </p>
          {cryptoEnabled ? (
            <button
              type="button"
              onClick={payCrypto}
              disabled={cryptoBusy}
              className="w-full rounded-lg bg-accent px-4 py-2 font-semibold text-black hover:opacity-90 disabled:opacity-50"
            >
              {cryptoBusy ? "Ouverture…" : "Payer en crypto"}
            </button>
          ) : (
            <p className="rounded-lg border border-border p-3 text-muted">Le paiement crypto arrive bientôt. Utilise Mobile Money en attendant.</p>
          )}
          {cryptoError && <p className="text-danger">{cryptoError}</p>}
        </div>
      )}
    </Card>
  );
}
