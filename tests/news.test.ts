import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseCalendar } from "../src/lib/news/calendar";

const raw = JSON.parse(readFileSync(new URL("./fixtures/calendar.json", import.meta.url), "utf8"));

test("calendrier : lignes valides gardées, triées, en UTC", () => {
  const ev = parseCalendar(raw);
  assert.equal(ev.length, 4);
  assert.deepEqual(ev.map((e) => e.currency), ["EUR", "JPY", "USD", "USD"]);
  const nfp = ev.find((e) => e.title.startsWith("Non-Farm"))!;
  assert.equal(nfp.date, "2026-12-04T13:30:00.000Z");
  assert.equal(nfp.impact, "high");
  assert.equal(nfp.forecast, "180K");
  assert.equal(nfp.id, "202612041330-usd-non-farm-employment-change");
  assert.equal(ev.find((e) => e.currency === "JPY")!.forecast, null);
  assert.equal(ev.find((e) => e.currency === "JPY")!.impact, "holiday");
});

test("calendrier : flux invalide -> liste vide", () => {
  assert.deepEqual(parseCalendar(null), []);
  assert.deepEqual(parseCalendar({ error: "rate limit" }), []);
});
