import { verifyRegistrationResponse } from "@simplewebauthn/server";

export async function onRequestPost({ request, env }) {
  const expectedChallenge = await env.PORTAL_KV.get("reg-challenge");
  if (!expectedChallenge) return new Response("No challenge", { status: 400 });
  await env.PORTAL_KV.delete("reg-challenge"); // single-use: consume before verifying

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: env.RP_ORIGIN,
      expectedRPID: env.RP_ID,
    });
  } catch {
    return new Response("Not verified", { status: 401 });
  }
  if (!verification.verified) return new Response("Not verified", { status: 401 });

  // First-run lockdown: never overwrite an existing credential (account takeover).
  if (await env.PORTAL_KV.get("credential")) {
    return new Response("Already registered", { status: 403 });
  }

  const { credential } = verification.registrationInfo;
  await env.PORTAL_KV.put("credential", JSON.stringify({
    id: credential.id,
    publicKey: Array.from(credential.publicKey),
    counter: credential.counter,
  }));
  return Response.json({ verified: true });
}
