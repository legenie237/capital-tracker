/**
 * Lecture des exports de plateformes de trading, sans dépendance externe.
 * Formats : rapport d'historique MetaTrader 5 (HTML), relevé détaillé MetaTrader 4 (HTML), CSV générique.
 */

export type ImportedTrade = {
  external_id: string;
  symbol: string;
  direction: "buy" | "sell";
  opened_at: string; // "AAAA-MM-JJTHH:mm:ss" heure de la plateforme, sans fuseau
  closed_at: string | null;
  entry_price: number;
  exit_price: number | null;
  stop_loss: number | null;
  take_profit: number | null;
  lot_size: number | null;
  pnl: number;
  fees: number;
};

export type ParseResult = {
  format: "mt5" | "mt4" | "csv";
  trades: ImportedTrade[];
  skipped: number;
  /** Pour le CSV : en-têtes et correspondance devinée, modifiables par l'utilisateur */
  csv?: { headers: string[]; rows: string[][]; mapping: CsvMapping };
};

export const CSV_FIELDS = {
  symbol: "Instrument",
  direction: "Direction (buy/sell)",
  opened_at: "Date d'entrée",
  closed_at: "Date de sortie",
  entry_price: "Prix d'entrée",
  exit_price: "Prix de sortie",
  lot_size: "Volume / lots",
  pnl: "Résultat (profit)",
  fees: "Commission / frais",
  swap: "Swap",
  stop_loss: "Stop loss",
  take_profit: "Take profit",
  external_id: "Identifiant (ticket)",
} as const;
export type CsvField = keyof typeof CSV_FIELDS;
export type CsvMapping = Partial<Record<CsvField, number>>;

/* ---------- utilitaires ---------- */

/** Décode un fichier : MetaTrader enregistre souvent ses rapports en UTF-16. */
export function decodeFile(buf: ArrayBuffer): string {
  const b = new Uint8Array(buf);
  if (b[0] === 0xff && b[1] === 0xfe) return new TextDecoder("utf-16le").decode(buf);
  if (b[0] === 0xfe && b[1] === 0xff) return new TextDecoder("utf-16be").decode(buf);
  // UTF-16 sans BOM : un octet nul sur deux
  if (b.length > 3 && b[1] === 0 && b[3] === 0) return new TextDecoder("utf-16le").decode(buf);
  return new TextDecoder("utf-8").decode(buf);
}

export function parseNumber(raw: string | undefined | null): number | null {
  if (raw === undefined || raw === null) return null;
  let s = raw.split("/")[0].replace(/[\s  ]/g, "").replace(/[^\d.,\-+]/g, "");
  if (!s || s === "-" || s === "+") return null;
  // "1.234,56" ou "1,234.56" ou "12,5"
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  if (lastComma > lastDot) s = s.replace(/\./g, "").replace(",", ".");
  else s = s.replace(/,/g, "");
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** Accepte "2026.11.20 14:32:10", "2026-11-20 14:32", "20/11/2026 14:32", ISO… Renvoie "AAAA-MM-JJTHH:mm:ss". */
export function parseDate(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const s = raw.trim();
  let m = s.match(/^(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (m) return iso(m[1], m[2], m[3], m[4], m[5], m[6]);
  m = s.match(/^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (m) return iso(m[3], m[2], m[1], m[4], m[5], m[6]); // jour/mois/année (format européen)
  if (/^\d{10,13}$/.test(s)) {
    const d = new Date(s.length === 13 ? Number(s) : Number(s) * 1000);
    return d.toISOString().slice(0, 19);
  }
  return null;
}

function iso(y: string, mo: string, d: string, h = "0", mi = "0", se = "0") {
  const p = (v: string) => v.padStart(2, "0");
  return `${y}-${p(mo)}-${p(d)}T${p(h)}:${p(mi)}:${p(se)}`;
}

function direction(raw: string | undefined): "buy" | "sell" | null {
  const s = (raw ?? "").trim().toLowerCase();
  if (/^(buy|long|achat|b)$/.test(s)) return "buy";
  if (/^(sell|short|vente|s)$/.test(s)) return "sell";
  return null;
}

function decodeEntities(s: string) {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

/** Extrait les lignes d'un tableau HTML (cellules fusionnées « colspan » dépliées). */
export function htmlRows(html: string): string[][] {
  const rows: string[][] = [];
  for (const tr of html.match(/<tr[\s\S]*?<\/tr>/gi) ?? []) {
    const cells: string[] = [];
    for (const m of tr.matchAll(/<t([dh])([^>]*)>([\s\S]*?)<\/t\1>/gi)) {
      const attrs = m[2];
      if (/class\s*=\s*["']?[^"'>]*hidden/i.test(attrs)) continue; // colonnes masquées des rapports MetaTrader
      const text = decodeEntities(m[3].replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
      const span = Number(attrs.match(/colspan\s*=\s*["']?(\d+)/i)?.[1] ?? 1);
      cells.push(text);
      for (let i = 1; i < span; i++) cells.push("");
    }
    rows.push(cells);
  }
  return rows;
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z/]/g, "");

/** Repère les colonnes d'une ligne d'en-tête ; les doublons (Time, Price) donnent ouverture puis clôture. */
function headerIndex(header: string[]) {
  const seen: Record<string, number[]> = {};
  header.forEach((h, i) => {
    const k = norm(h);
    if (k) (seen[k] ??= []).push(i);
  });
  return (key: string, nth = 0) => seen[key]?.[nth];
}

/* ---------- MetaTrader 5 ---------- */

function parseMt5(rows: string[][]): ParseResult {
  const start = rows.findIndex((r) => r.length <= 3 && r.some((c) => /^positions$/i.test(c)));
  const headerAt = rows.findIndex((r, i) => i > start && r.some((c) => /^position$/i.test(c)) && r.some((c) => /^symbol$/i.test(c)));
  const trades: ImportedTrade[] = [];
  let skipped = 0;
  if (headerAt < 0) return { format: "mt5", trades, skipped };
  const col = headerIndex(rows[headerAt]);
  const idx = {
    openTime: col("time", 0), id: col("position"), symbol: col("symbol"), type: col("type"), volume: col("volume"),
    openPrice: col("price", 0), sl: col("s/l"), tp: col("t/p"), closeTime: col("time", 1), closePrice: col("price", 1),
    commission: col("commission"), swap: col("swap"), profit: col("profit"),
  };

  for (const r of rows.slice(headerAt + 1)) {
    const nonEmpty = r.filter(Boolean);
    if (nonEmpty.length <= 2) {
      if (nonEmpty.some((c) => /^(orders|deals|open positions|working orders|results)$/i.test(c))) break;
      continue;
    }
    const t = buildTrade({
      id: cell(r, idx.id), symbol: cell(r, idx.symbol), type: cell(r, idx.type), volume: cell(r, idx.volume),
      openTime: cell(r, idx.openTime), openPrice: cell(r, idx.openPrice), sl: cell(r, idx.sl), tp: cell(r, idx.tp),
      closeTime: cell(r, idx.closeTime), closePrice: cell(r, idx.closePrice), commission: cell(r, idx.commission),
      swap: cell(r, idx.swap), profit: cell(r, idx.profit),
    });
    if (t) trades.push(t);
    else skipped++;
  }
  return { format: "mt5", trades, skipped };
}

/* ---------- MetaTrader 4 ---------- */

function parseMt4(rows: string[][]): ParseResult {
  const start = rows.findIndex((r) => r.some((c) => /^closed transactions:?$/i.test(c)));
  const headerAt = rows.findIndex((r, i) => i >= start && r.some((c) => /^ticket$/i.test(c)) && r.some((c) => /^item$/i.test(c)));
  const trades: ImportedTrade[] = [];
  let skipped = 0;
  if (headerAt < 0) return { format: "mt4", trades, skipped };
  const col = headerIndex(rows[headerAt]);
  const idx = {
    id: col("ticket"), openTime: col("opentime"), type: col("type"), volume: col("size"), symbol: col("item"),
    openPrice: col("price", 0), sl: col("s/l"), tp: col("t/p"), closeTime: col("closetime"), closePrice: col("price", 1),
    commission: col("commission"), taxes: col("taxes"), swap: col("swap"), profit: col("profit"),
  };

  for (const r of rows.slice(headerAt + 1)) {
    if (r.some((c) => /^(open trades|working orders|summary|closed p\/l):?$/i.test(c))) break;
    if (!/^\d+$/.test(cell(r, idx.id) ?? "")) continue; // lignes de total, annulations
    const type = (cell(r, idx.type) ?? "").toLowerCase();
    if (type !== "buy" && type !== "sell") { skipped++; continue; } // balance, ordres en attente
    const taxes = parseNumber(cell(r, idx.taxes)) ?? 0;
    const t = buildTrade({
      id: `mt4-${cell(r, idx.id)}`, symbol: cell(r, idx.symbol), type, volume: cell(r, idx.volume),
      openTime: cell(r, idx.openTime), openPrice: cell(r, idx.openPrice), sl: cell(r, idx.sl), tp: cell(r, idx.tp),
      closeTime: cell(r, idx.closeTime), closePrice: cell(r, idx.closePrice), commission: cell(r, idx.commission),
      swap: cell(r, idx.swap), profit: cell(r, idx.profit),
    });
    if (t) { t.fees += Math.abs(taxes); trades.push(t); } else skipped++;
  }
  return { format: "mt4", trades, skipped };
}

function cell(r: string[], i: number | undefined) {
  return i === undefined ? undefined : r[i];
}

type RawTrade = {
  id?: string; symbol?: string; type?: string; volume?: string; openTime?: string; openPrice?: string;
  sl?: string; tp?: string; closeTime?: string; closePrice?: string; commission?: string; swap?: string; profit?: string;
};

function buildTrade(raw: RawTrade): ImportedTrade | null {
  const dir = direction(raw.type);
  const symbol = (raw.symbol ?? "").toUpperCase().replace(/\s+/g, "");
  const opened = parseDate(raw.openTime);
  const entry = parseNumber(raw.openPrice);
  const profit = parseNumber(raw.profit);
  if (!dir || !symbol || !opened || entry === null || profit === null) return null;
  const swap = parseNumber(raw.swap) ?? 0;
  const commission = parseNumber(raw.commission) ?? 0;
  const sl = parseNumber(raw.sl);
  const tp = parseNumber(raw.tp);
  return {
    external_id: raw.id?.trim() || fingerprint([symbol, dir, opened, String(entry), String(profit)]),
    symbol,
    direction: dir,
    opened_at: opened,
    closed_at: parseDate(raw.closeTime),
    entry_price: entry,
    exit_price: parseNumber(raw.closePrice),
    stop_loss: sl ? sl : null, // MetaTrader écrit 0 quand il n'y a pas de stop
    take_profit: tp ? tp : null,
    lot_size: parseNumber(raw.volume),
    pnl: Math.round((profit + swap) * 100) / 100, // le swap fait partie du résultat
    fees: Math.abs(commission),
  };
}

/** Empreinte stable d'une ligne, pour ne pas importer deux fois le même trade quand il n'a pas d'identifiant. */
function fingerprint(parts: string[]) {
  let h = 2166136261;
  for (const ch of parts.join("|")) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return `csv-${(h >>> 0).toString(36)}`;
}

/* ---------- CSV ---------- */

export function csvRows(text: string): string[][] {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const sep = [";", "\t", ","].sort((a, b) => firstLine.split(b).length - firstLine.split(a).length)[0];
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') quoted = false;
      else cur += c;
    } else if (c === '"') quoted = true;
    else if (c === sep) { row.push(cur.trim()); cur = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cur.trim());
      if (row.some(Boolean)) rows.push(row);
      row = []; cur = "";
    } else cur += c;
  }
  row.push(cur.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

const GUESS: Record<CsvField, RegExp> = {
  symbol: /^(symbol|symbole|instrument|item|pair|paire|market|ticker|actif|asset)$/,
  direction: /^(type|side|direction|sens|action|buysell)$/,
  opened_at: /^(opentime|opendate|entrytime|entrydate|dateentree|ouverture|open|time|date|datetime|heureouverture)$/,
  closed_at: /^(closetime|closedate|exittime|exitdate|datesortie|cloture|close|fermeture)$/,
  entry_price: /^(openprice|entryprice|prixentree|entry|price|prix|avgentryprice)$/,
  exit_price: /^(closeprice|exitprice|prixsortie|exit|avgexitprice)$/,
  lot_size: /^(volume|lots|lot|size|quantity|qty|quantite|taille)$/,
  pnl: /^(profit|pnl|p&l|pl|realizedpnl|netprofit|resultat|gain|profitloss)$/,
  fees: /^(commission|commissions|fee|fees|frais)$/,
  swap: /^(swap|swaps|financing|rollover)$/,
  stop_loss: /^(sl|s\/l|stoploss|stop)$/,
  take_profit: /^(tp|t\/p|takeprofit|target)$/,
  external_id: /^(ticket|id|position|positionid|order|orderid|tradeid|deal)$/,
};

export function guessMapping(headers: string[]): CsvMapping {
  const mapping: CsvMapping = {};
  const keys = headers.map((h) => h.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z&/]/g, ""));
  for (const field of Object.keys(GUESS) as CsvField[]) {
    const i = keys.findIndex((k, idx) => GUESS[field].test(k) && !Object.values(mapping).includes(idx));
    if (i >= 0) mapping[field] = i;
  }
  return mapping;
}

export function tradesFromCsv(rows: string[][], mapping: CsvMapping): { trades: ImportedTrade[]; skipped: number } {
  const trades: ImportedTrade[] = [];
  let skipped = 0;
  const get = (r: string[], f: CsvField) => (mapping[f] === undefined ? undefined : r[mapping[f]!]);
  for (const r of rows) {
    const t = buildTrade({
      id: get(r, "external_id"), symbol: get(r, "symbol"), type: get(r, "direction"), volume: get(r, "lot_size"),
      openTime: get(r, "opened_at"), openPrice: get(r, "entry_price"), sl: get(r, "stop_loss"), tp: get(r, "take_profit"),
      closeTime: get(r, "closed_at"), closePrice: get(r, "exit_price"), commission: get(r, "fees"),
      swap: get(r, "swap"), profit: get(r, "pnl"),
    });
    if (t) trades.push(t);
    else skipped++;
  }
  return { trades, skipped };
}

/* ---------- point d'entrée ---------- */

export function parseImport(text: string): ParseResult {
  if (/<table/i.test(text)) {
    const rows = htmlRows(text);
    const flat = rows.map((r) => r.join(" ")).join("\n");
    if (/closed transactions/i.test(flat)) return parseMt4(rows);
    if (rows.some((r) => r.some((c) => /^position$/i.test(c)))) return parseMt5(rows);
    return { format: "mt5", trades: [], skipped: 0 };
  }
  const all = csvRows(text);
  const headers = all[0] ?? [];
  const rows = all.slice(1);
  const mapping = guessMapping(headers);
  const { trades, skipped } = tradesFromCsv(rows, mapping);
  return { format: "csv", trades, skipped, csv: { headers, rows, mapping } };
}
