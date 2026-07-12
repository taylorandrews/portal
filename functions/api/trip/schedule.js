// GET /api/trip/schedule — committed schedule.json + live KV overlay, merged.
// Auth: session cookie via the global middleware (this path is not public).
import { mergedResponse, json } from "../../lib/trip.js";

export async function onRequestGet({ env, request }) {
  try {
    return json(await mergedResponse(env, request));
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
}
