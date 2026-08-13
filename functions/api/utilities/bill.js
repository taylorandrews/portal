// POST /api/utilities/bill  Body: { utility, start, end, amount }
// KV write is authoritative; Google Sheets append is best-effort and reported.
import { loadSeed, loadOverlay, saveOverlay, mergeBills, validateBill, normalizeBill, json }
  from "../../lib/utilities.js";
import { appendBillRow } from "../../lib/sheets.js";

export async function onRequestPost({ env, request }) {
  let body;
  try { body = await request.json(); } catch { return json({ error: "invalid JSON body" }, 400); }
  const err = validateBill(body);
  if (err) return json({ error: err }, 400);

  const bill = normalizeBill(body);
  const overlay = await loadOverlay(env.PORTAL_KV);
  overlay.push(bill);
  await saveOverlay(env.PORTAL_KV, overlay); // authoritative first

  let sheet = { ok: false, error: null };
  try { await appendBillRow(env, bill); sheet.ok = true; }
  catch (e) { sheet.error = String(e).slice(0, 200); }

  if (sheet.ok) { // flip the flag on the stored copy
    bill.sheetSynced = true;
    await saveOverlay(env.PORTAL_KV, overlay);
  }

  const seed = await loadSeed(env, request);
  return json({ bill, sheet, bills: mergeBills(seed, overlay) });
}
