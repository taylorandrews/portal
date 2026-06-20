import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { buildManifest } from "./manifest.mjs";

test("builds manifest entries and copy plan", () => {
  const projects = [
    {
      dir: "/projects/hundred-hole-day",
      config: {
        name: "100 Hole Day", icon: "⛳", group: "Golf",
        outputs: [
          { title: "Live Tracker", path: "output/index.html" },
          { title: "Course Map", path: "output/map.html", icon: "🗺️" },
        ],
      },
    },
  ];
  const { manifest, copies } = buildManifest(projects);
  const p = manifest.projects[0];
  assert.equal(p.slug, "100-hole-day");
  assert.equal(p.group, "Golf");
  assert.equal(p.outputs[0].href, "100-hole-day/live-tracker/index.html");
  assert.equal(p.outputs[0].icon, "⛳");          // inherits project icon
  assert.equal(p.outputs[1].icon, "🗺️");          // own icon
  assert.deepEqual(copies, [
    { from: join("/projects/hundred-hole-day", "output"), to: "100-hole-day/live-tracker" },
    { from: join("/projects/hundred-hole-day", "output"), to: "100-hole-day/course-map" },
  ]);
});

test("dedupes colliding output slugs within a project", () => {
  const { manifest } = buildManifest([{
    dir: "/p/x",
    config: { name: "X", outputs: [
      { title: "Map", path: "a/index.html" },
      { title: "Map", path: "b/index.html" },
    ] },
  }]);
  const slugs = manifest.projects[0].outputs.map((o) => o.slug);
  assert.deepEqual(slugs, ["map", "map-2"]);
});
