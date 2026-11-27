"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button, Card } from "@/components/ui";
import {
  CSV_FIELDS,
  decodeFile,
  parseImport,
  tradesFromCsv,
  type CsvField,
  type CsvMapping,
  type ParseResult,
} from "@/lib/import/parse";
import { importTrades } from "./actions";

const FORMAT_LABEL = { mt5: "Rapport MetaTrader 5", mt4: "Relevé MetaTrader 4", csv: "Fichier CSV" };
const REQUIRED: CsvField[] = ["symbol", "direction", "opened_at", "entry_price", "pnl"];
const CHUNK = 500;

export function ImportWizard() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParseResult | null>(null);
  const [mapping, setMapping] = useState<CsvMapping>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ inserted: number; duplicates: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setDone(null);
    if (file.size > 10 * 1024 * 1024) return setError("Fichier trop gros (10 Mo maximum).");
    if (/\.xlsx?$/i.test(file.name)) {
      return setError("Les fichiers Excel ne sont pas encore lus : enregistrez le rapport en HTML (MetaTrader) ou en CSV.");
    }
    const text = decodeFile(await file.arrayBuffer());
    const result = parseImport(text);
    setFileName(file.name);
    setParsed(result);
    setMapping(result.csv?.mapping ?? {});
    if (result.format !== "csv" && result.trades.length === 0) {
      setError("Aucun trade clôturé trouvé dans ce rapport. Vérifiez qu'il s'agit bien de l'historique du compte.");
    }
  }

  // Pour un CSV, les trades sont recalculés quand l'utilisateur change la correspondance des colonnes
  const current = useMemo(() => {
    if (!parsed) return null;
    if (parsed.format !== "csv" || !parsed.csv) return { trades: parsed.trades, skipped: parsed.skipped };
    return tradesFromCsv(parsed.csv.rows, mapping);
  }, [parsed, mapping]);

  const missing = parsed?.format === "csv" ? REQUIRED.filter((f) => mapping[f] === undefined) : [];

  async function onImport() {
    if (!parsed || !current?.trades.length) return;
    setBusy(true);
    setError(null);
    let inserted = 0;
    let duplicates = 0;
    const source = parsed.format === "csv" ? "csv" : "mt5"; // MT4 et MT5 partagent la source « mt5 »
    for (let i = 0; i < current.trades.length; i += CHUNK) {
      const res = await importTrades(source, current.trades.slice(i, i + CHUNK), new Date().getTimezoneOffset());
      if (res.error) {
        setError(res.error);
        setBusy(false);
        return;
      }
      inserted += res.inserted ?? 0;
      duplicates += res.duplicates ?? 0;
    }
    setDone({ inserted, duplicates });
    setBusy(false);
  }

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="font-semibold">1. Exportez votre historique</h2>
        <div className="mt-3 grid gap-4 text-sm text-muted md:grid-cols-3">
          <div>
            <p className="font-medium text-foreground">MetaTrader 5</p>
            <p>Onglet <b>Historique</b> → clic droit → <b>Rapport</b> → <b>HTML</b>. Choisissez la période (par exemple « Tout l&apos;historique »).</p>
          </div>
          <div>
            <p className="font-medium text-foreground">MetaTrader 4</p>
            <p>Onglet <b>Historique du compte</b> → clic droit → <b>Toute l&apos;historique</b>, puis clic droit → <b>Enregistrer comme rapport détaillé</b>.</p>
          </div>
          <div>
            <p className="font-medium text-foreground">Autre plateforme</p>
            <p>Exportez vos trades en <b>CSV</b> (Binance, cTrader, TradingView…). Vous pourrez indiquer à quoi correspond chaque colonne.</p>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="font-semibold">2. Déposez le fichier</h2>
        <label
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); onFile(e.dataTransfer.files[0]); }}
          className={`mt-3 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-10 text-center ${dragging ? "border-accent" : "border-border"} hover:border-accent`}
        >
          <span className="font-medium">{fileName ?? "Cliquez ou glissez votre fichier ici"}</span>
          <span className="mt-1 text-sm text-muted">HTML (MetaTrader 4/5) ou CSV, 10 Mo maximum</span>
          <input type="file" accept=".htm,.html,.csv,.txt" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
        </label>
        {parsed && (
          <p className="mt-3 text-sm text-muted">
            Format détecté : <span className="text-foreground">{FORMAT_LABEL[parsed.format]}</span>
            {current && ` · ${current.trades.length} trade(s) lisible(s)`}
            {current && current.skipped > 0 && ` · ${current.skipped} ligne(s) ignorée(s) (dépôts, ordres annulés, lignes incomplètes)`}
          </p>
        )}
      </Card>

      {parsed?.format === "csv" && parsed.csv && (
        <Card>
          <h2 className="font-semibold">3. Vérifiez les colonnes</h2>
          <p className="mt-1 text-sm text-muted">Nous avons deviné la correspondance. Corrigez-la si besoin ; les champs marqués * sont obligatoires.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(Object.keys(CSV_FIELDS) as CsvField[]).map((f) => (
              <label key={f} className="block space-y-1 text-sm">
                <span className={missing.includes(f) ? "text-danger" : "text-muted"}>
                  {CSV_FIELDS[f]}{REQUIRED.includes(f) && " *"}
                </span>
                <select
                  value={mapping[f] ?? ""}
                  onChange={(e) => setMapping((m) => ({ ...m, [f]: e.target.value === "" ? undefined : Number(e.target.value) }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:border-accent"
                >
                  <option value="">— aucune —</option>
                  {parsed.csv!.headers.map((h, i) => (
                    <option key={i} value={i}>{h || `Colonne ${i + 1}`}</option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </Card>
      )}

      {current && current.trades.length > 0 && (
        <Card className="p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 p-6 pb-3">
            <h2 className="font-semibold">Aperçu ({Math.min(10, current.trades.length)} sur {current.trades.length})</h2>
            {missing.length === 0 && !done && (
              <Button onClick={onImport} disabled={busy} className="sm:w-auto">
                {busy ? "Import en cours…" : `Importer ${current.trades.length} trade(s)`}
              </Button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="border-y border-border text-left text-muted">
                <tr>
                  {["Ouverture", "Instrument", "Direction", "Lots", "Entrée", "Sortie", "Frais", "Résultat"].map((h) => (
                    <th key={h} className={`px-4 py-2 font-normal ${h === "Résultat" ? "text-right" : ""}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {current.trades.slice(0, 10).map((t) => (
                  <tr key={t.external_id} className="border-b border-border last:border-0">
                    <td className="whitespace-nowrap px-4 py-2">{t.opened_at.replace("T", " ").slice(0, 16)}</td>
                    <td className="px-4 py-2 font-medium">{t.symbol}</td>
                    <td className="px-4 py-2">{t.direction === "buy" ? "Achat" : "Vente"}</td>
                    <td className="px-4 py-2 tabular-nums">{t.lot_size ?? "–"}</td>
                    <td className="px-4 py-2 tabular-nums">{t.entry_price}</td>
                    <td className="px-4 py-2 tabular-nums">{t.exit_price ?? "–"}</td>
                    <td className="px-4 py-2 tabular-nums">{t.fees}</td>
                    <td className={`px-4 py-2 text-right font-medium tabular-nums ${t.pnl > 0 ? "text-accent" : t.pnl < 0 ? "text-danger" : ""}`}>{t.pnl}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {missing.length > 0 && parsed && (
        <p className="text-sm text-danger">Indiquez les colonnes obligatoires : {missing.map((f) => CSV_FIELDS[f]).join(", ")}.</p>
      )}
      {error && <p className="text-sm text-danger">{error}</p>}
      {done && (
        <Card>
          <p className="font-semibold text-accent">
            {done.inserted} trade(s) importé(s){done.duplicates > 0 && `, ${done.duplicates} déjà présent(s) ignoré(s)`}.
          </p>
          <p className="mt-2 text-sm text-muted">
            Pensez à compléter le setup, les émotions et les erreurs des trades importés pour des statistiques plus utiles.
          </p>
          <div className="mt-4 flex gap-4 text-sm">
            <Link href="/trades" className="text-accent">Voir le journal</Link>
            <Link href="/dashboard" className="text-accent">Voir le tableau de bord</Link>
          </div>
        </Card>
      )}
    </div>
  );
}
