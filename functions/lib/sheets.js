// Google Sheets append via a service account. Signs a JWT (RS256) with
// WebCrypto — no external deps, runs on Cloudflare Workers. All pure helpers
// are exported for unit tests; network calls live in appendBillRow().
export const PAYMENTS_TAB = "Payments";     // first tab of "Missouri Utilities"; override with env.SHEET_TAB
export const PAYMENTS_RANGE = `${PAYMENTS_TAB}!A:F`;
const paymentsRange = (env) => `${env.SHEET_TAB || PAYMENTS_TAB}!A:F`;
export const DEFAULT_PROVIDERS = {
  Electric: { entity: "Evergy", account: "SW Credit" },
  Gas: { entity: "Spire", account: "SW Credit" },
  Internet: { entity: "AT&T", account: "SW Credit" },
  Water: { entity: "KC Water", account: "BMO Checking" },
};

const enc = new TextEncoder();
const b64url = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)))
  .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
export const b64urlJSON = (obj) => b64url(enc.encode(JSON.stringify(obj)));

export function toSheetDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${m}/${d}/${String(y).slice(-2)}`;
}

export function carryProviderFields(existingRows, utility) {
  // existingRows: array of [Utility, Entity, Start, End, Cost, Account]; last match wins.
  let hit = null;
  for (const r of existingRows) if (r[0] === utility) hit = r;
  if (hit) return { entity: hit[1] || "", account: hit[5] || "" };
  const d = DEFAULT_PROVIDERS[utility] || { entity: "", account: "" };
  return { entity: d.entity, account: d.account };
}

export function buildRow(bill, provider) {
  return [bill.utility, provider.entity, toSheetDate(bill.start), toSheetDate(bill.end),
    bill.amount, provider.account];
}

// --- network ---
function pemToArrayBuffer(pem) {
  const body = pem.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  const bin = atob(body);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

async function accessToken(sa) {
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: sa.client_email, scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600,
  };
  const signingInput = `${b64urlJSON({ alg: "RS256", typ: "JWT" })}.${b64urlJSON(claim)}`;
  const key = await crypto.subtle.importKey("pkcs8", pemToArrayBuffer(sa.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, enc.encode(signingInput));
  const jwt = `${signingInput}.${b64url(sig)}`;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  if (!res.ok) throw new Error(`token ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return (await res.json()).access_token;
}

function loadSA(env) {
  if (!env.GOOGLE_SA_JSON_B64) throw new Error("GOOGLE_SA_JSON_B64 not set");
  return JSON.parse(atob(env.GOOGLE_SA_JSON_B64));
}

// Best-effort: appends one row, carrying Entity/Account from the utility's
// latest existing row. Returns { ok:true } or throws (caller catches).
export async function appendBillRow(env, bill) {
  const sa = loadSA(env);
  const token = await accessToken(sa);
  const base = `https://sheets.googleapis.com/v4/spreadsheets/${env.SHEET_ID}`;
  const range = paymentsRange(env);
  const auth = { authorization: `Bearer ${token}` };
  const getRes = await fetch(`${base}/values/${encodeURIComponent(range)}`, { headers: auth });
  if (!getRes.ok) throw new Error(`values.get ${getRes.status}`);
  const rows = (await getRes.json()).values || [];
  const provider = carryProviderFields(rows.slice(1), bill.utility); // skip header
  const row = buildRow(bill, provider);
  const appendRes = await fetch(
    `${base}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    { method: "POST", headers: { ...auth, "content-type": "application/json" },
      body: JSON.stringify({ values: [row] }) });
  if (!appendRes.ok) throw new Error(`values.append ${appendRes.status}: ${(await appendRes.text()).slice(0, 200)}`);
  return { ok: true };
}
