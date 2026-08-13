// GET /api/utilities/data -> { bills: mergedSeedAndOverlay }
import { loadSeed, loadOverlay, mergeBills, json } from "../../lib/utilities.js";

export async function onRequestGet({ env, request }) {
  const [seed, overlay] = await Promise.all([loadSeed(env, request), loadOverlay(env.PORTAL_KV)]);
  return json({ bills: mergeBills(seed, overlay) });
}
