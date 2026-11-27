import { test } from "node:test";
import assert from "node:assert/strict";
import { buildCoachContext } from "../src/lib/coach/context";
import { demoTrades } from "../src/lib/demo-data";

const NOW = new Date("2026-11-27T18:00:00Z");

test("le contexte du coach ne garde que la période demandée", () => {
  const ctx = buildCoachContext(demoTrades(NOW), NOW, 7);
  assert.equal(ctx.recentCount, 5);
  assert.equal(ctx.totalCount, 90);
  assert.match(ctx.text, /Trades de la période \(5 sur 5/);
  assert.match(ctx.text, /Coût de chaque erreur:\n- Trade de revanche/);
});

test("le contexte coupe les notes trop longues et ignore les trades futurs", () => {
  const base = demoTrades(NOW)[0];
  const ctx = buildCoachContext(
    [
      { ...base, closed_at: "2026-11-26T10:00:00Z", notes: "x".repeat(1000) },
      { ...base, closed_at: "2026-12-30T10:00:00Z", notes: "futur" },
    ],
    NOW,
  );
  assert.equal(ctx.recentCount, 1);
  assert.match(ctx.text, /note: x{300}…/);
  assert.doesNotMatch(ctx.text, /futur/);
});

test("journal vide : aucun trade sur la période", () => {
  const ctx = buildCoachContext([], NOW);
  assert.equal(ctx.recentCount, 0);
  assert.match(ctx.text, /aucun trade sur la période/);
});
