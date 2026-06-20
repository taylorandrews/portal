import { verifySession } from "./lib/session.js";

const PUBLIC_PREFIXES = ["/login.html", "/api/auth/", "/styles/", "/icons/", "/manifest.webmanifest"];

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

  if (PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p))) {
    return next();
  }
  const token = cookie(request, "portal_session");
  if (token && (await verifySession(env.SESSION_SECRET, token))) {
    return next();
  }
  return Response.redirect(new URL("/login.html", request.url).toString(), 302);
}
