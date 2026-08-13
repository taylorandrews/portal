// KV overlay for utility bills + request helpers. Pure math is re-exported
// from utilities.compute.js so callers have one import.
export * from "./utilities.compute.js";
import { UTILITIES } from "./utilities.compute.js";

export const BILLS_KEY = "utilities:bills";

export async function loadOverlay(kv) {
  const raw = await kv.get(BILLS_KEY);
  if (!raw) return [];
  try { const v = JSON.parse(raw); return Array.isArray(v) ? v : []; } catch { return []; }
}
export async function saveOverlay(kv, bills) {
  await kv.put(BILLS_KEY, JSON.stringify(bills));
}

const ISO = /^\d{4}-\d{2}-\d{2}$/;
export function validateBill(body) {
  if (!body || !UTILITIES.includes(body.utility)) return "utility must be one of " + UTILITIES.join(", ");
  if (!ISO.test(body.start) || !ISO.test(body.end)) return "start/end must be YYYY-MM-DD";
  if (body.end < body.start) return "end must be on or after start";
  if (!(Number(body.amount) > 0)) return "amount must be greater than 0";
  return null;
}
export function normalizeBill(body) {
  return {
    id: crypto.randomUUID(), ts: new Date().toISOString(),
    utility: body.utility, start: body.start, end: body.end,
    amount: Math.round(Number(body.amount) * 100) / 100, sheetSynced: false,
  };
}

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

// Read the committed seed (output/data/bills.json) via the ASSETS binding,
// resolving the synced path from manifest.json (mirrors functions/lib/trip.js).
async function fetchAssetJson(env, request, path) {
  const res = await env.ASSETS.fetch(new Request(new URL(path, request.url)));
  const body = await res.text();
  if (!res.ok || body.trimStart().startsWith("<")) throw new Error(`asset ${path} missing (${res.status})`);
  return JSON.parse(body);
}
export async function loadSeed(env, request) {
  const manifest = await fetchAssetJson(env, request, "/manifest.json");
  const proj = (manifest.projects || []).find((p) => p.slug === "utilities");
  const href = proj?.outputs?.[0]?.href;
  if (!href) throw new Error("utilities output not in manifest.json");
  const dir = href.slice(0, href.lastIndexOf("/"));
  return fetchAssetJson(env, request, `/${dir}/data/bills.json`);
}
