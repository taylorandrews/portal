#!/usr/bin/env node
import { cpSync, rmSync, mkdirSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { discoverProjects } from "./lib/discover.mjs";
import { buildManifest } from "./lib/manifest.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(repoRoot, "public");
const projectsDir = resolve(process.env.PORTAL_PROJECTS_DIR || join(repoRoot, ".."));

// Reserved (non-generated) entries that must never be wiped.
const RESERVED = new Set(["styles", "icons", "index.html", "app.js", "login.html",
  "sw.js", "manifest.webmanifest", "manifest.json"]);

function wipeGeneratedOutputs() {
  if (!existsSync(publicDir)) return;
  for (const entry of readdirSync(publicDir)) {
    if (RESERVED.has(entry)) continue;
    rmSync(join(publicDir, entry), { recursive: true, force: true });
  }
}

const { projects, warnings } = discoverProjects(projectsDir);
warnings.forEach((w) => console.warn("⚠ ", w));

const { manifest, copies } = buildManifest(projects);

mkdirSync(publicDir, { recursive: true });
wipeGeneratedOutputs();

for (const { from, to } of copies) {
  if (!existsSync(from)) {
    console.warn("⚠  missing output dir, skipped:", from);
    continue;
  }
  cpSync(from, join(publicDir, to), { recursive: true });
}

writeFileSync(join(publicDir, "manifest.json"), JSON.stringify(manifest, null, 2));
console.log(`✓ synced ${manifest.projects.length} project(s), ${copies.length} output(s).`);
