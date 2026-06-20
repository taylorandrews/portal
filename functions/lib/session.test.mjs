import { test } from "node:test";
import assert from "node:assert/strict";
import { signSession, verifySession } from "./session.js";

const SECRET = "test-secret-please-change";

test("round-trips a valid session", async () => {
  const token = await signSession(SECRET, { ttlMs: 60_000 });
  const ok = await verifySession(SECRET, token);
  assert.equal(ok, true);
});

test("rejects tampered token", async () => {
  const token = await signSession(SECRET, { ttlMs: 60_000 });
  assert.equal(await verifySession(SECRET, token + "x"), false);
});

test("rejects expired token", async () => {
  const token = await signSession(SECRET, { ttlMs: -1 });
  assert.equal(await verifySession(SECRET, token), false);
});

test("rejects wrong secret", async () => {
  const token = await signSession(SECRET, { ttlMs: 60_000 });
  assert.equal(await verifySession("other", token), false);
});
