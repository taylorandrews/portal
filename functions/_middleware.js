import { verifySession } from "./lib/session.js";

// Exact public files (no prefix matching, so /login.html.evil stays gated).
const PUBLIC_EXACT = new Set(["/login.html", "/manifest.webmanifest"]);
// Public directory/API prefixes (trailing slash required).
const PUBLIC_PREFIXES = ["/api/auth/", "/styles/", "/icons/"];

function cookie(request, name) {
  const raw = request.headers.get("Cookie") || "";
  for (const part of raw.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=");
  }
  return null;
}

export async function onRequest(context) {
  const { request, next, env } = context;
  const { pathname } = new URL(request.url);

  if (PUBLIC_EXACT.has(pathname) || PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return next();
  }
  const token = cookie(request, "portal_session");
  if (token && (await verifySession(env.SESSION_SECRET, token))) {
    return next();
  }
  return Response.redirect(new URL("/login.html", request.url).toString(), 302);
}
