import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { discoverProjects } from "./discover.mjs";

function setup() {
  const root = mkdtempSync(join(tmpdir(), "portal-disc-"));
  const mk = (name, json) => {
    mkdirSync(join(root, name), { recursive: true });
    if (json !== undefined) writeFileSync(join(root, name, "portal.json"), json);
  };
  return { root, mk };
}

test("discovers valid projects and skips invalid ones", () => {
  const { root, mk } = setup();
  mk("a", JSON.stringify({ name: "A", outputs: [{ title: "X", path: "out/i.html" }] }));
  mk("b", "{ not json");
  mk("c", JSON.stringify({ name: "C" })); // missing outputs
  mk("d"); // no portal.json at all
  const { projects, warnings } = discoverProjects(root);
  assert.equal(projects.length, 1);
  assert.equal(projects[0].config.name, "A");
  assert.equal(projects[0].dir, join(root, "a"));
  assert.equal(warnings.length, 2); // b invalid json, c missing outputs
  rmSync(root, { recursive: true, force: true });
});
