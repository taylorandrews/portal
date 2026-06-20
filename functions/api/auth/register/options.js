import { generateRegistrationOptions } from "@simplewebauthn/server";

export async function onRequestGet({ env }) {
  if (await env.PORTAL_KV.get("credential")) {
    return new Response("Already registered", { status: 403 });
  }
  const options = await generateRegistrationOptions({
    rpName: "TA Portal",
    rpID: env.RP_ID,
    userID: new TextEncoder().encode("owner"),
    userName: "owner",
    authenticatorSelection: { residentKey: "required", userVerification: "required" },
  });
  await env.PORTAL_KV.put("reg-challenge", options.challenge, { expirationTtl: 300 });
  return Response.json(options);
}
