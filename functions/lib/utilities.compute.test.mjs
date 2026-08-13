import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  daysInclusive, dailyRate, dailySeries, currentRunRate,
  trailing12, highsLows, startAutofill, mergeBills, UTILITIES,
} from "./utilities.compute.js";

const b = (utility, start, end, amount, id = `${utility}-${start}`) =>
  ({ id, utility, start, end, amount });

test("daysInclusive counts both endpoints", () => {
  assert.equal(daysInclusive("2025-06-11", "2025-06-25"), 15);
  assert.equal(daysInclusive("2025-06-11", "2025-06-11"), 1);
});

test("dailyRate matches the sheet (144.17 / 15 = 9.61)", () => {
  assert.equal(Math.round(dailyRate(b("Electric", "2025-06-11", "2025-06-25", 144.17)) * 100) / 100, 9.61);
});

test("dailySeries sums active utilities per day", () => {
  const bills = [
    b("Electric", "2025-01-01", "2025-01-10", 100), // 10/day
    b("Gas", "2025-01-05", "2025-01-14", 50),        // 5/day
  ];
  const series = dailySeries(bills);
  const jan01 = series.find((r) => r.date === "2025-01-01");
  const jan05 = series.find((r) => r.date === "2025-01-05");
  assert.equal(jan01.Electric, 10);
  assert.equal(jan01.Gas, 0);
  assert.equal(jan05.Electric, 10);
  assert.equal(jan05.Gas, 5);
});

test("currentRunRate sums each utility's most-recent bill rate", () => {
  const bills = [
    b("Electric", "2025-05-01", "2025-05-10", 100), // older, ignored
    b("Electric", "2025-06-01", "2025-06-10", 200), // latest -> 20/day
    b("Water", "2025-06-01", "2025-06-10", 30),      // -> 3/day
  ];
  const r = currentRunRate(bills);
  assert.equal(r.perDay, 23);
  assert.equal(r.perMonth, Math.round(23 * 30.4 * 100) / 100);
});

test("trailing12 prorates bills straddling the 365-day edge", () => {
  // asOf 2025-06-15; a 10-day bill 5 days inside the window at 10/day -> 50 counted
  const bills = [b("Gas", "2024-06-10", "2024-06-19", 100)]; // window opens 2024-06-16
  const t = trailing12(bills, "2025-06-15");
  assert.equal(t.byUtility.Gas, 40); // days 16,17,18,19 inside = 4 days * 10
});

test("startAutofill returns latest end + 1 day for a utility", () => {
  const bills = [
    b("Gas", "2025-05-01", "2025-05-31", 100),
    b("Gas", "2025-06-01", "2025-06-30", 100),
  ];
  assert.equal(startAutofill(bills, "Gas"), "2025-07-01");
  assert.equal(startAutofill(bills, "Electric"), null); // none yet
});

test("mergeBills concatenates seed + overlay and sorts by start", () => {
  const merged = mergeBills(
    [b("Gas", "2025-06-01", "2025-06-30", 100, "seed-1")],
    [b("Gas", "2025-05-01", "2025-05-31", 90, "kv-1")],
  );
  assert.deepEqual(merged.map((x) => x.id), ["kv-1", "seed-1"]);
});

test("highsLows picks extreme utility and month", () => {
  const bills = [
    b("Gas", "2025-01-01", "2025-01-31", 310),  // Jan heavy
    b("Water", "2025-01-01", "2025-01-31", 31),
  ];
  const hl = highsLows(bills, "2025-06-15");
  assert.equal(hl.utilityHigh.utility, "Gas");
  assert.equal(hl.utilityLow.utility, "Water");
  assert.equal(hl.monthHigh.month, "2025-01");
});

test("UTILITIES is the canonical ordered list", () => {
  assert.deepEqual(UTILITIES, ["Internet", "Water", "Gas", "Electric"]);
});

test("compute.js copies are byte-identical", () => {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const server = fs.readFileSync(path.join(here, "utilities.compute.js"), "utf8");
  const client = fs.readFileSync(
    path.join(here, "../../../utilities/output/lib/compute.js"), "utf8");
  assert.equal(server, client, "PORTAL/functions/lib/utilities.compute.js and UTIL/output/lib/compute.js differ — re-copy");
});
