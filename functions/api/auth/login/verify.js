import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { signSession } from "../../../lib/session.js";

const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

export async function onRequestPost({ request, env }) {
  const expectedChallenge = await env.PORTAL_KV.get("auth-challenge");
  const stored = await env.PORTAL_KV.get("credential", "json");
  if (!expectedChallenge || !stored) return new Response("Bad state", { status: 400 });
  await env.PORTAL_KV.delete("auth-challenge"); // single-use: consume before verifying

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: env.RP_ORIGIN,
      expectedRPID: env.RP_ID,
      credential: {
        id: stored.id,
        publicKey: new Uint8Array(stored.publicKey),
        counter: stored.counter,
      },
    });
  } catch {
    return new Response("Not verified", { status: 401 });
  }
  if (!verification.verified) return new Response("Not verified", { status: 401 });

  stored.counter = verification.authenticationInfo.newCounter;
  await env.PORTAL_KV.put("credential", JSON.stringify(stored));

  const token = await signSession(env.SESSION_SECRET, { ttlMs: SESSION_TTL_MS });
  return new Response(JSON.stringify({ verified: true }), {
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": `portal_session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${SESSION_TTL_MS / 1000}`,
    },
  });
}
