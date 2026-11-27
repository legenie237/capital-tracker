import { test } from "node:test";
import assert from "node:assert/strict";
import { computeStats } from "../src/lib/stats";

const mk = (pnl: number, d: string, extra = {}) => ({
  pnl, fees: 0, risk_amount: 50, status: "closed" as const, opened_at: d, closed_at: d,
  symbol: "EURUSD", setup: null, session: "Londres", followed_plan: true, mistakes: [] as string[], ...extra,
});

test("statistiques de base", () => {
  const s = computeStats([
    mk(100, "2026-01-01"),
    mk(-50, "2026-01-02", { mistakes: ["Stop déplacé"] }),
    mk(-50, "2026-01-03", { followed_plan: false }),
    mk(150, "2026-01-04"),
    { ...mk(0, "2026-01-05"), status: "open" as const, pnl: null },
  ]);
  assert.equal(s.total, 4);
  assert.equal(s.winRate, 50);
  assert.equal(s.net, 150);
  assert.equal(s.profitFactor, 2.5);
  assert.equal(s.maxDrawdown, 100);
  assert.equal(s.avgR, 0.75);
  assert.equal(s.maxLossStreak, 2);
  assert.equal(s.planRate, 75);
  assert.deepEqual(s.equity.map((e) => e.value), [100, 50, 0, 150]);
  assert.deepEqual(s.byMistake.map((m) => [m.key, m.net]), [["Stop déplacé", -50]]);
  assert.equal(s.cleanNet, 200);
});
