// /api/trip/updates — inspect and clear the KV overlay.
//   GET               → { updates: [...] }   (full entries incl. patches)
//   DELETE?id=<uuid>  → remove one entry
//   DELETE            → clear all entries
//
// Auth: EITHER a portal session cookie (the guide's updates modal) OR
// `Authorization: Bearer $SYNC_TOKEN` (the pull_updates.py canonize script).
// This exact path is exempted from the global middleware so the bearer path
// can reach it; auth is enforced here instead.
import { verifySession } from "../../lib/session.js";
import { loadUpdates, saveUpdates, json } from "../../lib/trip.js";

function cookie(request, name) {
  const raw = request.headers.get("Cookie") || "";
  for (const part of raw.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=");
  }
  return null;
}

async function authed(env, request) {
  const auth = request.headers.get("Authorization") || "";
  if (env.SYNC_TOKEN && auth === `Bearer ${env.SYNC_TOKEN}`) return true;
  const token = cookie(request, "portal_session");
  return !!(token && (await verifySession(env.SESSION_SECRET, token)));
}

export async function onRequestGet({ env, request }) {
  if (!(await authed(env, request))) return json({ error: "unauthorized" }, 401);
  return json({ updates: await loadUpdates(env) });
}

export async function onRequestDelete({ env, request }) {
  if (!(await authed(env, request))) return json({ error: "unauthorized" }, 401);
  const id = new URL(request.url).searchParams.get("id");
  let updates = await loadUpdates(env);
  const before = updates.length;
  updates = id ? updates.filter((u) => u.id !== id) : [];
  await saveUpdates(env, updates);
  return json({ removed: before - updates.length, remaining: updates.length });
}
