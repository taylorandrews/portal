import { generateAuthenticationOptions } from "@simplewebauthn/server";

export async function onRequestGet({ env }) {
  const stored = await env.PORTAL_KV.get("credential", "json");
  if (!stored) return new Response("Not registered", { status: 404 });
  const options = await generateAuthenticationOptions({
    rpID: env.RP_ID,
    allowCredentials: [{ id: stored.id }],
    userVerification: "required",
  });
  await env.PORTAL_KV.put("auth-challenge", options.challenge, { expirationTtl: 300 });
  return Response.json(options);
}
