import { test } from "node:test";
import assert from "node:assert/strict";
import { loadOverlay, saveOverlay, validateBill, normalizeBill, BILLS_KEY } from "./utilities.js";

function fakeKV(initial = null) {
  let store = initial;
  return { get: async () => store, put: async (_k, v) => { store = v; } };
}

test("loadOverlay returns [] when empty or malformed", async () => {
  assert.deepEqual(await loadOverlay(fakeKV(null)), []);
  assert.deepEqual(await loadOverlay(fakeKV("not json")), []);
});

test("saveOverlay then loadOverlay round-trips", async () => {
  const kv = fakeKV();
  await saveOverlay(kv, [{ id: "1" }]);
  assert.deepEqual(await loadOverlay(kv), [{ id: "1" }]);
});

test("validateBill rejects bad input", () => {
  assert.match(validateBill({ utility: "Nope", start: "2025-01-01", end: "2025-01-02", amount: 1 }), /utility/);
  assert.match(validateBill({ utility: "Gas", start: "2025-01-05", end: "2025-01-01", amount: 1 }), /end/);
  assert.match(validateBill({ utility: "Gas", start: "2025-01-01", end: "2025-01-05", amount: 0 }), /amount/);
  assert.equal(validateBill({ utility: "Gas", start: "2025-01-01", end: "2025-01-05", amount: 12.5 }), null);
});

test("normalizeBill adds id, ts, sheetSynced=false and coerces amount", () => {
  const bill = normalizeBill({ utility: "Gas", start: "2025-01-01", end: "2025-01-05", amount: "12.50" });
  assert.equal(bill.utility, "Gas");
  assert.equal(bill.amount, 12.5);
  assert.equal(bill.sheetSynced, false);
  assert.match(bill.id, /.+/);
  assert.match(bill.ts, /^\d{4}-\d{2}-\d{2}T/);
});

test("BILLS_KEY is namespaced", () => assert.equal(BILLS_KEY, "utilities:bills"));
