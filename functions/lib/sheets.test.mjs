import { test } from "node:test";
import assert from "node:assert/strict";
import { toSheetDate, buildRow, carryProviderFields, DEFAULT_PROVIDERS, b64urlJSON } from "./sheets.js";

test("toSheetDate renders M/D/YY without leading zeros", () => {
  assert.equal(toSheetDate("2026-06-26"), "6/26/26");
  assert.equal(toSheetDate("2025-01-05"), "1/5/25");
});

test("carryProviderFields uses the utility's most-recent existing sheet row", () => {
  const existing = [
    ["Gas", "Spire", "5/16/26", "6/16/26", "44.72", "SW Credit"],
    ["Water", "KC Water", "5/24/26", "6/23/26", "55.88", "BMO Checking"],
  ];
  assert.deepEqual(carryProviderFields(existing, "Gas"), { entity: "Spire", account: "SW Credit" });
});

test("carryProviderFields falls back to defaults when utility is absent", () => {
  assert.deepEqual(carryProviderFields([], "Water"),
    { entity: DEFAULT_PROVIDERS.Water.entity, account: DEFAULT_PROVIDERS.Water.account });
});

test("buildRow assembles A..F in sheet order", () => {
  const row = buildRow(
    { utility: "Gas", start: "2026-06-17", end: "2026-07-17", amount: 43.37 },
    { entity: "Spire", account: "SW Credit" });
  assert.deepEqual(row, ["Gas", "Spire", "6/17/26", "7/17/26", 43.37, "SW Credit"]);
});

test("b64urlJSON encodes objects to base64url with no padding", () => {
  const s = b64urlJSON({ a: 1 });
  assert.doesNotMatch(s, /[+/=]/);
  assert.equal(Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString(), '{"a":1}');
});
