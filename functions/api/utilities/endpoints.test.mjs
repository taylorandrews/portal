import { test } from "node:test";
import assert from "node:assert/strict";
import { onRequestGet } from "./data.js";
import { onRequestPost } from "./bill.js";

// Minimal ASSETS + KV doubles so the endpoints run without wrangler.
const MANIFEST = { projects: [{ slug: "utilities", outputs: [{ href: "utilities/utilities/index.html" }] }] };
const SEED = [{ id: "seed-gas-0", utility: "Gas", start: "2025-05-01", end: "2025-05-31", amount: 100 }];

function fakeEnv(overrides = {}) {
  let kv = null;
  return {
    PORTAL_KV: { get: async () => kv, put: async (_k, v) => { kv = v; } },
    ASSETS: {
      fetch: async (req) => {
        const { pathname } = new URL(req.url);
        if (pathname.endsWith("/manifest.json")) return new Response(JSON.stringify(MANIFEST));
        if (pathname.endsWith("/data/bills.json")) return new Response(JSON.stringify(SEED));
        return new Response("<!doctype html>", { status: 200 });
      },
    },
    ...overrides,
  };
}
const reqWith = (body) => new Request("http://localhost/api/utilities/bill", {
  method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

test("GET /data returns merged seed + overlay", async () => {
  const env = fakeEnv();
  await env.PORTAL_KV.put("utilities:bills", JSON.stringify(
    [{ id: "kv-1", utility: "Gas", start: "2025-06-01", end: "2025-06-30", amount: 90 }]));
  const res = await onRequestGet({ env, request: new Request("http://localhost/api/utilities/data") });
  const data = await res.json();
  assert.equal(data.bills.length, 2);
  assert.deepEqual(data.bills.map((b) => b.id), ["seed-gas-0", "kv-1"]); // sorted by start
});

test("POST /bill persists to KV and reports sheet failure (no SA configured)", async () => {
  const env = fakeEnv(); // no GOOGLE_SA_JSON_B64 -> appendBillRow throws -> best-effort catch
  const res = await onRequestPost({ env, request: reqWith(
    { utility: "Water", start: "2025-07-01", end: "2025-07-31", amount: 55 }) });
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.equal(data.sheet.ok, false);
  assert.match(data.sheet.error, /GOOGLE_SA_JSON_B64/);
  assert.equal(data.bill.sheetSynced, false);
  // authoritative KV write happened and is reflected in the returned merge
  assert.ok(data.bills.some((b) => b.utility === "Water" && b.amount === 55));
  const stored = JSON.parse(await env.PORTAL_KV.get("utilities:bills"));
  assert.equal(stored.length, 1);
});

test("POST /bill rejects invalid input with 400", async () => {
  const env = fakeEnv();
  const res = await onRequestPost({ env, request: reqWith(
    { utility: "Nope", start: "2025-07-01", end: "2025-07-31", amount: 55 }) });
  assert.equal(res.status, 400);
  assert.match((await res.json()).error, /utility/);
});
