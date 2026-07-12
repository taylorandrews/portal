// POST /api/trip/update — capture a free-form trip note from the guide.
// Body: { "text": "staying in Denver on the 15th" }
//
// The raw note is ALWAYS stored first (never lose a thought). Then, if
// ANTHROPIC_API_KEY is configured (Pages → Settings → Environment variables),
// Claude parses it against the current merged schedule into a structured
// patch that takes effect live. Without the key, the note shows up in the
// guide as a pending sticky and gets folded in at the next pull_updates run.
//
// Auth: session cookie via the global middleware.
import {
  loadBaseSchedule, loadUpdates, saveUpdates, applyUpdates,
  mergedResponse, json,
} from "../../lib/trip.js";

const SYSTEM = `You convert Taylor's free-form road-trip notes into a JSON patch for his trip schedule.

The schedule is a JSON object with "days": [{date:"YYYY-MM-DD", phase, rounds, title, location, flight?{number,departs,from,arrives,to,conf}, course?{name,ranks,udisc_url}, course2?, stay?{status:"booked"|"idea", name?, where?, site?, note?, lat?, lon?}, locked?[], tournament?, notes?[]}]. The trip runs Aug 8 – Sep 7, 2026; bare dates like "the 15th" mean August 2026 unless clearly September.

Reply with ONLY a JSON object, no markdown fences:
{"summary": "<8 words max, e.g. 'Stay in Denver Aug 15'>",
 "ops": [{"date": "YYYY-MM-DD",
          "set": {<day fields to overwrite, shallow-merged; null deletes a key>},
          "note": "<optional short sticky note for that day>"}]}

Rules:
- Only change what the note states. Never invent confirmations, coordinates, times, or URLs.
- New stay mentioned without booking proof → stay.status "idea" with a "note" describing it; clearly booked → status "booked" with name/where.
- New course to play → set course (or course2 if the day already has a course to keep): {name, ranks:"<city/state or context>"}; omit udisc_url unless given.
- Update "title" and "location" only when the change makes them wrong.
- If the note is vague, ambiguous, or you cannot pick a date confidently: return {"summary":"…","ops":[{"date":"<best-guess date or omit>","note":"<the note, lightly cleaned>"}]} — a sticky beats a wrong edit. If not even a date is safe, return {"summary":"…","ops":[]}.`;

async function parseWithClaude(env, mergedSchedule, text) {
  const slim = { ...mergedSchedule };
  delete slim._pending; delete slim._updates;
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: env.TRIP_MODEL || "claude-haiku-4-5",
      max_tokens: 1500,
      system: SYSTEM,
      messages: [{
        role: "user",
        content: `Current schedule:\n${JSON.stringify(slim)}\n\nTaylor's update:\n"""${text}"""`,
      }],
    }),
  });
  if (!res.ok) throw new Error(`anthropic ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const msg = await res.json();
  let out = (msg.content?.[0]?.text || "").trim();
  out = out.replace(/^```(json)?\s*/i, "").replace(/```\s*$/, "");
  const patch = JSON.parse(out);
  if (!patch || !Array.isArray(patch.ops)) throw new Error("bad patch shape");
  return patch;
}

export async function onRequestPost({ env, request }) {
  let text;
  try { text = (await request.json()).text; } catch { /* fallthrough */ }
  if (!text || typeof text !== "string" || !text.trim()) {
    return json({ error: "body must be {\"text\": \"...\"}" }, 400);
  }
  text = text.trim().slice(0, 2000);

  const entry = {
    id: crypto.randomUUID(),
    ts: new Date().toISOString(),
    text,
    status: "raw",
    patch: null,
  };

  const updates = await loadUpdates(env);

  if (env.ANTHROPIC_API_KEY) {
    try {
      const base = await loadBaseSchedule(env, request);
      const { schedule } = applyUpdates(base, updates); // parse against current live view
      entry.patch = await parseWithClaude(env, schedule, text);
      entry.status = "parsed";
    } catch (e) {
      entry.status = "error"; // raw note is still kept and shown as pending
      entry.error = String(e).slice(0, 300);
    }
  }

  updates.push(entry);
  await saveUpdates(env, updates);
  return json(await mergedResponse(env, request));
}
