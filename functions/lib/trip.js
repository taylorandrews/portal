// Shared helpers for the trip-update pipeline (/api/trip/*).
//
// Data model in KV (PORTAL_KV):
//   key "trip:updates" → JSON array of update entries:
//     { id, ts, text, status: "parsed" | "raw" | "error",
//       patch: { summary, ops: [ { date, set?, note? } ] } | null }
//
// The committed schedule.json stays the source of truth in git; KV holds a
// live overlay that the phone guide sees immediately. `applyUpdates` merges
// the two. A local script (sabbatical/scripts/pull_updates.py) periodically
// folds the overlay into git and clears it.

export const UPDATES_KEY = "trip:updates";

// The guide deploys under a slugged path (public/<project>/<output>/), so
// resolve it from the synced manifest instead of hardcoding. Note: a missing
// asset path doesn't 404 on Pages — the SPA fallback serves index.html — so
// every fetch here validates that the body is actually JSON.
async function fetchAssetJson(env, request, path) {
  const res = await env.ASSETS.fetch(new Request(new URL(path, request.url)));
  const body = await res.text();
  if (!res.ok || body.trimStart().startsWith("<")) {
    throw new Error(`asset ${path} not found (status ${res.status})`);
  }
  return JSON.parse(body);
}

export async function loadBaseSchedule(env, request) {
  const manifest = await fetchAssetJson(env, request, "/manifest.json");
  const proj = (manifest.projects || []).find((p) => p.slug === "sabbatical");
  const href = proj?.outputs?.[0]?.href; // e.g. "sabbatical/sabbatical-trip/index.html"
  if (!href) throw new Error("sabbatical output not in manifest.json");
  const dir = href.slice(0, href.lastIndexOf("/"));
  return fetchAssetJson(env, request, `/${dir}/data/schedule.json`);
}

export async function loadUpdates(env) {
  const raw = await env.PORTAL_KV.get(UPDATES_KEY);
  if (!raw) return [];
  try { const v = JSON.parse(raw); return Array.isArray(v) ? v : []; }
  catch { return []; }
}

export async function saveUpdates(env, updates) {
  await env.PORTAL_KV.put(UPDATES_KEY, JSON.stringify(updates));
}

// Merge the overlay into a copy of the base schedule.
// - op.set: shallow-merge keys into the matching day (null deletes a key)
// - op.note: append to day.notes (rendered as sticky notes in the guide)
// - ops that don't match a day, and unparsed raw notes, surface in `pending`
export function applyUpdates(base, updates) {
  const s = JSON.parse(JSON.stringify(base));
  const pending = [];
  for (const u of updates) {
    const ops = u.patch && Array.isArray(u.patch.ops) ? u.patch.ops : null;
    if (!ops || !ops.length) {
      pending.push({ id: u.id, ts: u.ts, text: u.text, status: u.status });
      continue;
    }
    for (const op of ops) {
      const day = op.date && s.days.find((d) => d.date === op.date);
      if (!day) {
        pending.push({ id: u.id, ts: u.ts, text: op.note || u.text, status: "raw", date: op.date });
        continue;
      }
      if (op.set && typeof op.set === "object" && !Array.isArray(op.set)) {
        for (const [k, v] of Object.entries(op.set)) {
          if (v === null) delete day[k];
          else day[k] = v;
        }
        day._live = true;
      }
      if (op.note) {
        (day.notes ||= []).push(op.note);
        day._live = true;
      }
    }
  }
  return { schedule: s, pending };
}

// Response shape shared by GET /api/trip/schedule and POST /api/trip/update:
// the merged schedule, plus what's in the overlay (for the updates modal).
export async function mergedResponse(env, request) {
  const [base, updates] = await Promise.all([
    loadBaseSchedule(env, request),
    loadUpdates(env),
  ]);
  const { schedule, pending } = applyUpdates(base, updates);
  schedule._pending = pending;
  schedule._updates = updates.map((u) => ({
    id: u.id, ts: u.ts, text: u.text, status: u.status,
    summary: u.patch && u.patch.summary,
  }));
  return schedule;
}

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}
