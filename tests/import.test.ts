import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { decodeFile, parseImport, parseDate, parseNumber } from "../src/lib/import/parse";

function load(name: string) {
  const buf = readFileSync(new URL(`./fixtures/${name}`, import.meta.url));
  return parseImport(decodeFile(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)));
}

test("rapport MetaTrader 5 (UTF-8 et UTF-16)", () => {
  for (const f of ["mt5.html", "mt5-utf16.html"]) {
    const r = load(f);
    assert.equal(r.format, "mt5");
    assert.equal(r.trades.length, 2); // la section Orders est ignorée
    const [eur, gold] = r.trades;
    assert.deepEqual(
      { id: eur.external_id, sym: eur.symbol, dir: eur.direction, lots: eur.lot_size, pnl: eur.pnl, fees: eur.fees, sl: eur.stop_loss },
      { id: "123456789", sym: "EURUSD", dir: "buy", lots: 0.1, pnl: 27.8, fees: 0.7, sl: 1.08312 },
    );
    assert.equal(gold.pnl, -48.7); // profit + swap
    assert.equal(gold.entry_price, 2651.2);
    assert.equal(gold.stop_loss, null); // 0 = pas de stop
  }
});

test("relevé MetaTrader 4 : ignore dépôts, totaux et trades ouverts", () => {
  const r = load("mt4.html");
  assert.equal(r.format, "mt4");
  assert.deepEqual(r.trades.map((t) => t.external_id), ["mt4-45001", "mt4-45003"]);
  assert.equal(r.trades[0].symbol, "GBPUSD");
  assert.equal(r.trades[1].direction, "sell");
});

test("CSV français (point-virgule, virgule décimale, dates jj/mm/aaaa)", () => {
  const r = load("fr.csv");
  assert.equal(r.format, "csv");
  assert.equal(r.trades.length, 2);
  assert.equal(r.skipped, 1);
  assert.equal(r.trades[1].entry_price, 96500);
  assert.equal(r.trades[0].opened_at, "2026-11-20T10:15:00");
});

test("CSV sans identifiant : empreinte stable pour éviter les doublons", () => {
  const a = load("binance.csv").trades[0];
  const b = load("binance.csv").trades[0];
  assert.equal(a.direction, "buy"); // LONG
  assert.equal(a.external_id, b.external_id);
  assert.match(a.external_id, /^csv-/);
});

test("nombres et dates", () => {
  assert.equal(parseNumber("1 234,56"), 1234.56);
  assert.equal(parseNumber("1,234.56"), 1234.56);
  assert.equal(parseNumber("0.1 / 0.1"), 0.1);
  assert.equal(parseNumber(""), null);
  assert.equal(parseDate("2026.11.20 14:32:10"), "2026-11-20T14:32:10");
  assert.equal(parseDate("20/11/2026"), "2026-11-20T00:00:00");
});
