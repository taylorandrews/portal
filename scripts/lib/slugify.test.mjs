import { test } from "node:test";
import assert from "node:assert/strict";
import { slugify, dedupe } from "./slugify.mjs";

test("slugify lowercases and kebab-cases", () => {
  assert.equal(slugify("100 Hole Day"), "100-hole-day");
  assert.equal(slugify("Course Map!"), "course-map");
  assert.equal(slugify("  World Cup — v2 "), "world-cup-v2");
});

test("slugify falls back when empty", () => {
  assert.equal(slugify("!!!"), "item");
});

test("dedupe suffixes collisions deterministically", () => {
  assert.deepEqual(dedupe(["map", "map", "map"]), ["map", "map-2", "map-3"]);
});
