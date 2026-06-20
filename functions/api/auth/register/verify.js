import { verifyRegistrationResponse } from "@simplewebauthn/server";

export async function onRequestPost({ request, env }) {
  const expectedChallenge = await env.PORTAL_KV.get("reg-challenge");
  if (!expectedChallenge) return new Response("No challenge", { status: 400 });
  const body = await request.json();
  const verification = await verifyRegistrationResponse({
    response: body,
    expectedChallenge,
    expectedOrigin: env.RP_ORIGIN,
    expectedRPID: env.RP_ID,
  });
  if (!verification.verified) return new Response("Not verified", { status: 401 });

  const { credential } = verification.registrationInfo;
  await env.PORTAL_KV.put("credential", JSON.stringify({
    id: credential.id,
    publicKey: Array.from(credential.publicKey),
    counter: credential.counter,
  }));
  await env.PORTAL_KV.delete("reg-challenge");
  return Response.json({ verified: true });
}
