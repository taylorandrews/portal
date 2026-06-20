# Phone Portal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a private, app-like portal (Cloudflare Pages, passkey/Face-ID gated) that aggregates static outputs from many sibling project repos into one branded landing page.

**Architecture:** A static site in this repo. A Node sync script scans sibling repos for `portal.json`, copies their self-contained static outputs into `public/`, and regenerates `public/manifest.json`. A vanilla-JS landing page renders a branded icon grid from that manifest and runs as a PWA. Cloudflare Pages Functions + WebAuthn gate the whole site so opening it is a Face ID scan. Deploy is `sync → commit → push → Pages auto-deploy`.

**Tech Stack:** Node 20+ (ESM, built-in `node:test`), vanilla HTML/CSS/JS, PWA (manifest + service worker), Cloudflare Pages + Pages Functions, `@simplewebauthn/server` + `@simplewebauthn/browser`, Cloudflare KV, `sharp` (icon raster), `wrangler` (local dev + deploy).

**Spec:** `docs/superpowers/specs/2026-06-19-phone-portal-design.md`

---

## File Structure

```
portal/
  package.json                      # scripts + deps
  .gitignore
  wrangler.toml                     # Pages project + KV binding config
  CONVENTIONS.md                    # portal.json schema + how to add a project
  brand/
    icon.svg                        # master TA monogram (vector)
  scripts/
    lib/slugify.mjs                 # string -> kebab slug + dedupe helper
    lib/slugify.test.mjs
    lib/discover.mjs                # find + parse + validate portal.json files
    lib/discover.test.mjs
    lib/manifest.mjs                # discovered projects -> manifest + copy plan
    lib/manifest.test.mjs
    sync.mjs                        # CLI: discover -> copy -> write manifest
    gen-icons.mjs                   # rasterize brand/icon.svg -> public PNGs
  public/                           # the deployed site
    index.html                      # landing page (renders manifest)
    styles/tokens.css               # design tokens (colors/radii/spacing/type)
    styles/app.css                  # landing + tile styles
    app.js                          # fetch manifest, render grid
    login.html                      # passkey login/registration UI
    sw.js                           # service worker
    manifest.webmanifest            # PWA manifest
    icons/                          # generated app icons (gitignored, built)
    manifest.json                   # generated content manifest (gitignored, built)
    <slug>/...                      # generated copied outputs (gitignored, built)
  functions/
    _middleware.js                  # auth gate for all routes
    lib/session.js                  # HMAC session cookie sign/verify (Web Crypto)
    lib/session.test.mjs
    api/auth/register/options.js    # WebAuthn registration options
    api/auth/register/verify.js     # verify + store credential in KV
    api/auth/login/options.js       # WebAuthn auth options
    api/auth/login/verify.js        # verify + set session cookie
  .claude/skills/portal-output/SKILL.md   # teaches future sessions the convention
```

**Generated artifacts** (`public/manifest.json`, `public/icons/`, `public/<slug>/`) are gitignored and produced by `npm run sync` / `npm run icons` before deploy. Cloudflare Pages build command runs them so the repo stays clean.

---

## Phase 1 — Scaffold & branding tokens

### Task 1: Project scaffold

**Files:**
- Create: `package.json`, `.gitignore`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "portal",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "sync": "node scripts/sync.mjs",
    "icons": "node scripts/gen-icons.mjs",
    "build": "npm run icons && npm run sync",
    "test": "node --test",
    "dev": "wrangler pages dev public"
  },
  "dependencies": {
    "@simplewebauthn/server": "^13.0.0"
  },
  "devDependencies": {
    "sharp": "^0.33.0",
    "wrangler": "^3.0.0"
  }
}
```

- [ ] **Step 2: Create `.gitignore`**

```gitignore
node_modules/
.DS_Store
.wrangler/
# generated build artifacts
public/manifest.json
public/icons/
public/[a-z]*/
!public/styles/
```

Note: the last three rules ignore generated content. `public/styles/` is force-kept; `index.html`, `app.js`, etc. are files (not matched by the dir glob) so they stay tracked.

- [ ] **Step 3: Install deps**

Run: `npm install`
Expected: `node_modules/` created, lockfile written, no errors.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json .gitignore
git commit -m "chore: scaffold portal package"
```

### Task 2: Design tokens (branding foundation)

**Files:**
- Create: `public/styles/tokens.css`

Branding intent (from spec): Apple-esque restraint + tamed FiveThirtyEight editorial polish. One confident accent, system type, generous whitespace, rounded squares.

- [ ] **Step 1: Create `public/styles/tokens.css`**

```css
:root {
  /* Accent — 538-ish editorial red-orange, single confident hue */
  --accent: #ff5a36;
  --accent-press: #e34626;

  /* Neutrals — Apple-esque near-blacks/greys */
  --bg: #f5f5f7;
  --surface: #ffffff;
  --ink: #1d1d1f;
  --ink-2: #6e6e73;
  --hairline: #e3e3e6;

  /* Type — system stack */
  --font: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, system-ui, sans-serif;

  /* Shape */
  --radius-tile: 22px;   /* iOS app-icon curvature feel */
  --radius-card: 16px;
  --shadow: 0 1px 3px rgba(0,0,0,.08), 0 8px 24px rgba(0,0,0,.06);

  /* Spacing scale */
  --s1: 4px; --s2: 8px; --s3: 12px; --s4: 16px; --s5: 24px; --s6: 32px; --s7: 48px;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #000000;
    --surface: #1c1c1e;
    --ink: #f5f5f7;
    --ink-2: #98989d;
    --hairline: #2c2c2e;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add public/styles/tokens.css
git commit -m "feat: add brand design tokens"
```

---

## Phase 2 — Sync engine (TDD)

### Task 3: Slugify + dedupe helper

**Files:**
- Create: `scripts/lib/slugify.mjs`
- Test: `scripts/lib/slugify.test.mjs`

- [ ] **Step 1: Write the failing test**

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test scripts/lib/slugify.test.mjs`
Expected: FAIL — cannot find module `./slugify.mjs`.

- [ ] **Step 3: Write minimal implementation**

```js
export function slugify(input) {
  const s = String(input)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || "item";
}

export function dedupe(slugs) {
  const seen = new Map();
  return slugs.map((slug) => {
    const n = (seen.get(slug) ?? 0) + 1;
    seen.set(slug, n);
    return n === 1 ? slug : `${slug}-${n}`;
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test scripts/lib/slugify.test.mjs`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/slugify.mjs scripts/lib/slugify.test.mjs
git commit -m "feat: add slugify + dedupe helper"
```

### Task 4: Discover & validate `portal.json`

**Files:**
- Create: `scripts/lib/discover.mjs`
- Test: `scripts/lib/discover.test.mjs`

`discoverProjects(rootDir)` scans `rootDir/*/portal.json`, parses each, validates shape, and returns `{ projects, warnings }`. Invalid configs are skipped with a warning — never throw.

- [ ] **Step 1: Write the failing test**

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test scripts/lib/discover.test.mjs`
Expected: FAIL — cannot find module `./discover.mjs`.

- [ ] **Step 3: Write minimal implementation**

```js
import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";

function validate(config) {
  if (typeof config?.name !== "string" || !config.name.trim()) return "missing 'name'";
  if (!Array.isArray(config.outputs) || config.outputs.length === 0) return "missing 'outputs'";
  for (const o of config.outputs) {
    if (typeof o?.title !== "string" || !o.title.trim()) return "an output is missing 'title'";
    if (typeof o?.path !== "string" || !o.path.trim()) return "an output is missing 'path'";
  }
  return null;
}

export function discoverProjects(rootDir) {
  const projects = [];
  const warnings = [];
  for (const entry of readdirSync(rootDir)) {
    const dir = join(rootDir, entry);
    if (!statSync(dir).isDirectory()) continue;
    const cfgPath = join(dir, "portal.json");
    if (!existsSync(cfgPath)) continue;
    let config;
    try {
      config = JSON.parse(readFileSync(cfgPath, "utf8"));
    } catch {
      warnings.push(`${entry}: invalid JSON in portal.json — skipped`);
      continue;
    }
    const err = validate(config);
    if (err) {
      warnings.push(`${entry}: ${err} — skipped`);
      continue;
    }
    projects.push({ dir, config });
  }
  return { projects, warnings };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test scripts/lib/discover.test.mjs`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/discover.mjs scripts/lib/discover.test.mjs
git commit -m "feat: discover and validate portal.json files"
```

### Task 5: Build manifest + copy plan

**Files:**
- Create: `scripts/lib/manifest.mjs`
- Test: `scripts/lib/manifest.test.mjs`

`buildManifest(projects)` (projects from Task 4) returns `{ manifest, copies }`.
- `manifest.projects[]`: `{ slug, name, icon, group, outputs:[{ slug, title, icon, href }] }`
- `href` = `<projectSlug>/<outputSlug>/<entryFilename>`
- `copies[]`: `{ from, to }` where `from` = absolute dir containing the output's entry file, `to` = `<projectSlug>/<outputSlug>` (relative to `public/`).
- Default project icon `"📦"`; output icon falls back to project icon.

- [ ] **Step 1: Write the failing test**

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test scripts/lib/manifest.test.mjs`
Expected: FAIL — cannot find module `./manifest.mjs`.

- [ ] **Step 3: Write minimal implementation**

```js
import { dirname, basename, join } from "node:path";
import { slugify, dedupe } from "./slugify.mjs";

const DEFAULT_ICON = "📦";

export function buildManifest(projects) {
  const projectSlugs = dedupe(projects.map((p) => slugify(p.config.name)));
  const manifestProjects = [];
  const copies = [];

  projects.forEach((p, i) => {
    const pSlug = projectSlugs[i];
    const pIcon = p.config.icon || DEFAULT_ICON;
    const outSlugs = dedupe(p.config.outputs.map((o) => slugify(o.title)));
    const outputs = p.config.outputs.map((o, j) => {
      const oSlug = outSlugs[j];
      const entry = basename(o.path);
      copies.push({ from: join(p.dir, dirname(o.path)), to: `${pSlug}/${oSlug}` });
      return {
        slug: oSlug,
        title: o.title,
        icon: o.icon || pIcon,
        href: `${pSlug}/${oSlug}/${entry}`,
      };
    });
    manifestProjects.push({
      slug: pSlug,
      name: p.config.name,
      icon: pIcon,
      group: p.config.group || "Other",
      outputs,
    });
  });

  return { manifest: { projects: manifestProjects }, copies };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test scripts/lib/manifest.test.mjs`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/manifest.mjs scripts/lib/manifest.test.mjs
git commit -m "feat: build content manifest and copy plan"
```

### Task 6: Sync CLI

**Files:**
- Create: `scripts/sync.mjs`

Orchestrates discover → buildManifest → wipe & recopy outputs → write `manifest.json`. Default root = parent of the portal repo (`..`). Wipes only generated output dirs so stale projects drop out, then re-copies. Reads project root from `PORTAL_PROJECTS_DIR` env override if set.

- [ ] **Step 1: Write `scripts/sync.mjs`**

```js
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
```

- [ ] **Step 2: Smoke-test against a temp fixture**

Run:
```bash
TMP=$(mktemp -d); mkdir -p "$TMP/demo/out"; echo "<h1>hi</h1>" > "$TMP/demo/out/index.html"
echo '{"name":"Demo","icon":"🧪","outputs":[{"title":"Home","path":"out/index.html"}]}' > "$TMP/demo/portal.json"
PORTAL_PROJECTS_DIR="$TMP" node scripts/sync.mjs
cat public/manifest.json
```
Expected: prints `✓ synced 1 project(s), 1 output(s).`; `public/manifest.json` lists the Demo project; `public/demo/home/index.html` exists.

- [ ] **Step 3: Clean the smoke-test artifacts**

Run: `rm -rf public/demo public/manifest.json`
Expected: generated demo output removed (they're gitignored anyway).

- [ ] **Step 4: Commit**

```bash
git add scripts/sync.mjs
git commit -m "feat: add sync CLI"
```

---

## Phase 3 — Branded landing page & PWA

### Task 7: Landing page shell + tile styles

**Files:**
- Create: `public/index.html`, `public/styles/app.css`, `public/app.js`

- [ ] **Step 1: Create `public/index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="theme-color" content="#ff5a36" />
  <title>TA · Portal</title>
  <link rel="manifest" href="/manifest.webmanifest" />
  <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
  <link rel="icon" href="/icons/favicon.png" />
  <link rel="stylesheet" href="/styles/tokens.css" />
  <link rel="stylesheet" href="/styles/app.css" />
</head>
<body>
  <header class="masthead">
    <span class="monogram" aria-hidden="true">TA</span>
    <h1>Portal</h1>
  </header>
  <main id="grid" class="grid" aria-busy="true"></main>
  <script src="/app.js" type="module"></script>
</body>
</html>
```

- [ ] **Step 2: Create `public/styles/app.css`**

```css
* { box-sizing: border-box; }
body {
  margin: 0; font-family: var(--font); background: var(--bg); color: var(--ink);
  padding: max(env(safe-area-inset-top), var(--s5)) var(--s5) var(--s7);
  -webkit-font-smoothing: antialiased;
}
.masthead { display: flex; align-items: center; gap: var(--s3); margin: var(--s4) 0 var(--s6); }
.monogram {
  display: grid; place-items: center; width: 40px; height: 40px;
  background: var(--accent); color: #fff; border-radius: 11px;
  font-weight: 800; letter-spacing: -.04em; font-size: 16px;
}
.masthead h1 { font-size: 22px; font-weight: 700; margin: 0; letter-spacing: -.02em; }
.group-label {
  font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: .06em;
  color: var(--ink-2); margin: var(--s6) 0 var(--s3);
}
.grid { display: block; }
.tiles {
  display: grid; gap: var(--s4);
  grid-template-columns: repeat(auto-fill, minmax(92px, 1fr));
}
.tile { text-decoration: none; color: inherit; text-align: center; }
.tile-icon {
  display: grid; place-items: center; aspect-ratio: 1; width: 100%;
  background: var(--surface); border-radius: var(--radius-tile);
  box-shadow: var(--shadow); font-size: 34px; border: 1px solid var(--hairline);
  transition: transform .12s ease;
}
.tile:active .tile-icon { transform: scale(.94); }
.tile-title { display: block; margin-top: var(--s2); font-size: 12px; color: var(--ink-2); line-height: 1.25; }
.empty { color: var(--ink-2); }
```

- [ ] **Step 3: Create `public/app.js`**

```js
async function load() {
  const grid = document.getElementById("grid");
  let manifest;
  try {
    manifest = await (await fetch("/manifest.json", { cache: "no-cache" })).json();
  } catch {
    grid.innerHTML = `<p class="empty">No content yet. Run <code>npm run sync</code>.</p>`;
    grid.setAttribute("aria-busy", "false");
    return;
  }

  const groups = new Map();
  for (const p of manifest.projects) {
    if (!groups.has(p.group)) groups.set(p.group, []);
    groups.get(p.group).push(p);
  }

  const tile = (icon, title, href) => `
    <a class="tile" href="/${href}">
      <span class="tile-icon">${icon}</span>
      <span class="tile-title">${title}</span>
    </a>`;

  let html = "";
  for (const [group, projects] of groups) {
    html += `<h2 class="group-label">${group}</h2><div class="tiles">`;
    for (const p of projects) {
      // One tile per output; single-output projects read as one app icon.
      for (const o of p.outputs) {
        const title = p.outputs.length > 1 ? `${p.name} · ${o.title}` : p.name;
        html += tile(o.icon, title, o.href);
      }
    }
    html += `</div>`;
  }
  grid.innerHTML = html || `<p class="empty">No projects registered yet.</p>`;
  grid.setAttribute("aria-busy", "false");
}
load();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").catch(() => {});
}
```

- [ ] **Step 4: Verify locally**

Run:
```bash
TMP=$(mktemp -d); mkdir -p "$TMP/demo/out"; echo "<h1>hi from demo</h1>" > "$TMP/demo/out/index.html"
echo '{"name":"Demo","icon":"🧪","group":"Test","outputs":[{"title":"Home","path":"out/index.html"}]}' > "$TMP/demo/portal.json"
PORTAL_PROJECTS_DIR="$TMP" node scripts/sync.mjs
npx --yes http-server public -p 8099 >/dev/null 2>&1 & SRV=$!; sleep 1
curl -s localhost:8099/manifest.json | head -c 200; echo
kill $SRV; rm -rf public/demo public/manifest.json
```
Expected: manifest JSON prints with the Demo project. (Open `localhost:8099` manually if you want to eyeball the grid before killing the server.)

- [ ] **Step 5: Commit**

```bash
git add public/index.html public/styles/app.css public/app.js
git commit -m "feat: branded landing page grid"
```

### Task 8: PWA manifest + service worker

**Files:**
- Create: `public/manifest.webmanifest`, `public/sw.js`

- [ ] **Step 1: Create `public/manifest.webmanifest`**

```json
{
  "name": "TA Portal",
  "short_name": "Portal",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "background_color": "#f5f5f7",
  "theme_color": "#ff5a36",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-512-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

- [ ] **Step 2: Create `public/sw.js`**

Network-first for the shell so new syncs show up; ignores auth/API routes entirely.

```js
const CACHE = "portal-v1";
const SHELL = ["/", "/index.html", "/app.js", "/styles/tokens.css", "/styles/app.css"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) =>
    Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.pathname.startsWith("/api/")) return;
  e.respondWith(
    fetch(e.request).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match(e.request).then((m) => m || caches.match("/")))
  );
});
```

- [ ] **Step 3: Commit**

```bash
git add public/manifest.webmanifest public/sw.js
git commit -m "feat: PWA manifest and service worker"
```

### Task 9: TA monogram icon + raster generation

**Files:**
- Create: `brand/icon.svg`, `scripts/gen-icons.mjs`

- [ ] **Step 1: Create `brand/icon.svg`**

Apple-esque rounded square, single accent, bold "TA" monogram with a thin editorial baseline rule (the tamed 538 nod).

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ff6b4a"/>
      <stop offset="1" stop-color="#ff5a36"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#g)"/>
  <text x="256" y="300" text-anchor="middle"
        font-family="Helvetica, Arial, sans-serif" font-weight="700"
        font-size="240" letter-spacing="-12" fill="#ffffff">TA</text>
  <rect x="156" y="340" width="200" height="10" rx="5" fill="#ffffff" opacity="0.85"/>
</svg>
```

- [ ] **Step 2: Create `scripts/gen-icons.mjs`**

```js
import sharp from "sharp";
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const svg = readFileSync(join(repoRoot, "brand/icon.svg"));
const outDir = join(repoRoot, "public/icons");
mkdirSync(outDir, { recursive: true });

const targets = [
  ["icon-192.png", 192], ["icon-512.png", 512], ["icon-512-maskable.png", 512],
  ["apple-touch-icon.png", 180], ["favicon.png", 64],
];

for (const [name, size] of targets) {
  await sharp(svg).resize(size, size).png().toFile(join(outDir, name));
  console.log("✓", name);
}
```

- [ ] **Step 3: Generate and eyeball**

Run: `npm run icons`
Expected: prints `✓ icon-192.png` … `✓ favicon.png`; `public/icons/` contains 5 PNGs. Open `public/icons/icon-512.png` to confirm the TA monogram looks right (clean, centered, legible). If the font renders oddly, adjust `font-family`/`font-size` in `brand/icon.svg` and re-run.

- [ ] **Step 4: Commit**

```bash
git add brand/icon.svg scripts/gen-icons.mjs
git commit -m "feat: TA monogram icon + raster generation"
```

---

## Phase 4 — Passkey auth gate

> **Setup prerequisite (do once, document outputs in `CONVENTIONS.md`):** Create a Cloudflare Pages project connected to this repo, create a KV namespace, and bind it as `PORTAL_KV`. Set env vars/secrets: `RP_ID` (e.g. `portal.example.com`), `RP_ORIGIN` (e.g. `https://portal.example.com`), `SESSION_SECRET` (random 32+ bytes). These are needed for Tasks 11–14 to function in deploy/`wrangler pages dev`.

### Task 10: Session cookie sign/verify (TDD)

**Files:**
- Create: `functions/lib/session.js`
- Test: `functions/lib/session.test.mjs`

HMAC-signed, expiring token using Web Crypto (works in both Node 20+ and Workers).

- [ ] **Step 1: Write the failing test**

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test functions/lib/session.test.mjs`
Expected: FAIL — cannot find module `./session.js`.

- [ ] **Step 3: Write minimal implementation**

```js
const enc = new TextEncoder();

function b64url(bytes) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(secret, msg) {
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64url(await crypto.subtle.sign("HMAC", key, enc.encode(msg)));
}

export async function signSession(secret, { ttlMs = 86_400_000 } = {}) {
  const exp = Date.now() + ttlMs;
  const payload = b64url(enc.encode(JSON.stringify({ exp })));
  const sig = await hmac(secret, payload);
  return `${payload}.${sig}`;
}

export async function verifySession(secret, token) {
  if (typeof token !== "string" || !token.includes(".")) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  if ((await hmac(secret, payload)) !== sig) return false;
  try {
    const { exp } = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return typeof exp === "number" && Date.now() < exp;
  } catch {
    return false;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test functions/lib/session.test.mjs`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add functions/lib/session.js functions/lib/session.test.mjs
git commit -m "feat: HMAC session cookie sign/verify"
```

### Task 11: WebAuthn registration endpoints

**Files:**
- Create: `functions/api/auth/register/options.js`, `functions/api/auth/register/verify.js`

KV keys: `credential` (the single stored passkey), `reg-challenge` (transient). Registration is allowed only when no credential exists yet (first-run lockdown).

- [ ] **Step 1: Create `functions/api/auth/register/options.js`**

```js
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
```

- [ ] **Step 2: Create `functions/api/auth/register/verify.js`**

```js
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
```

- [ ] **Step 3: Commit**

```bash
git add functions/api/auth/register/
git commit -m "feat: WebAuthn registration endpoints"
```

### Task 12: WebAuthn login endpoints

**Files:**
- Create: `functions/api/auth/login/options.js`, `functions/api/auth/login/verify.js`

On success, sets the session cookie from Task 10. Cookie TTL kept short so opening the app re-challenges with Face ID (per spec). Start at 12h; tune later.

- [ ] **Step 1: Create `functions/api/auth/login/options.js`**

```js
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
```

- [ ] **Step 2: Create `functions/api/auth/login/verify.js`**

```js
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { signSession } from "../../../lib/session.js";

const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

export async function onRequestPost({ request, env }) {
  const expectedChallenge = await env.PORTAL_KV.get("auth-challenge");
  const stored = await env.PORTAL_KV.get("credential", "json");
  if (!expectedChallenge || !stored) return new Response("Bad state", { status: 400 });

  const body = await request.json();
  const verification = await verifyAuthenticationResponse({
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
  if (!verification.verified) return new Response("Not verified", { status: 401 });

  stored.counter = verification.authenticationInfo.newCounter;
  await env.PORTAL_KV.put("credential", JSON.stringify(stored));
  await env.PORTAL_KV.delete("auth-challenge");

  const token = await signSession(env.SESSION_SECRET, { ttlMs: SESSION_TTL_MS });
  return new Response(JSON.stringify({ verified: true }), {
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": `portal_session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${SESSION_TTL_MS / 1000}`,
    },
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add functions/api/auth/login/
git commit -m "feat: WebAuthn login endpoints + session cookie"
```

### Task 13: Auth middleware gate

**Files:**
- Create: `functions/_middleware.js`

Gates every route. Allows the login page, its assets, and `/api/auth/*` through; everything else requires a valid session cookie or redirects to `/login.html`.

- [ ] **Step 1: Create `functions/_middleware.js`**

```js
import { verifySession } from "./lib/session.js";

const PUBLIC_PREFIXES = ["/login.html", "/api/auth/", "/styles/", "/icons/", "/manifest.webmanifest"];

function cookie(request, name) {
  const raw = request.headers.get("Cookie") || "";
  for (const part of raw.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=");
  }
  return null;
}

export async function onRequest(context) {
  const { request, next, env } = context;
  const { pathname } = new URL(request.url);

  if (PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p))) {
    return next();
  }
  const token = cookie(request, "portal_session");
  if (token && (await verifySession(env.SESSION_SECRET, token))) {
    return next();
  }
  return Response.redirect(new URL("/login.html", request.url).toString(), 302);
}
```

- [ ] **Step 2: Commit**

```bash
git add functions/_middleware.js
git commit -m "feat: auth middleware gate"
```

### Task 14: Login / registration page

**Files:**
- Create: `public/login.html`

Uses `@simplewebauthn/browser` from a CDN. Shows "Register this device" on first run and "Unlock" thereafter; both trigger Face ID via the passkey.

- [ ] **Step 1: Create `public/login.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="theme-color" content="#ff5a36" />
  <title>Unlock · TA Portal</title>
  <link rel="stylesheet" href="/styles/tokens.css" />
  <style>
    body { margin:0; min-height:100vh; display:grid; place-items:center;
      font-family:var(--font); background:var(--bg); color:var(--ink); }
    .card { text-align:center; }
    .monogram { display:grid; place-items:center; width:88px; height:88px; margin:0 auto var(--s5);
      background:var(--accent); color:#fff; border-radius:24px; font-weight:800; font-size:36px; letter-spacing:-.04em; }
    button { font:inherit; font-weight:600; color:#fff; background:var(--accent);
      border:0; border-radius:12px; padding:14px 28px; }
    button:active { background:var(--accent-press); }
    .msg { color:var(--ink-2); margin-top:var(--s4); min-height:1.2em; font-size:14px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="monogram">TA</div>
    <button id="go">Unlock</button>
    <button id="register" hidden>Register this device</button>
    <p class="msg" id="msg"></p>
  </div>
  <script type="module">
    import { startRegistration, startAuthentication }
      from "https://esm.sh/@simplewebauthn/browser@13";
    const msg = document.getElementById("msg");
    const go = document.getElementById("go");
    const reg = document.getElementById("register");

    async function unlock() {
      msg.textContent = "Waiting for Face ID…";
      const opt = await fetch("/api/auth/login/options");
      if (opt.status === 404) { go.hidden = true; reg.hidden = false; msg.textContent = "Set up this device to begin."; return; }
      const resp = await startAuthentication({ optionsJSON: await opt.json() });
      const v = await fetch("/api/auth/login/verify", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(resp) });
      if (v.ok) location.href = "/"; else msg.textContent = "Unlock failed. Try again.";
    }
    async function register() {
      msg.textContent = "Registering…";
      const opt = await fetch("/api/auth/register/options");
      if (opt.status === 403) { msg.textContent = "Already registered."; return; }
      const resp = await startRegistration({ optionsJSON: await opt.json() });
      const v = await fetch("/api/auth/register/verify", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(resp) });
      if (v.ok) { reg.hidden = true; go.hidden = false; await unlock(); }
      else msg.textContent = "Registration failed.";
    }
    go.addEventListener("click", unlock);
    reg.addEventListener("click", register);
    unlock(); // auto-prompt on open
  </script>
</body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add public/login.html
git commit -m "feat: passkey login/registration page"
```

---

## Phase 5 — Conventions, skill, wiring & deploy

### Task 15: `wrangler.toml`

**Files:**
- Create: `wrangler.toml`

- [ ] **Step 1: Create `wrangler.toml`**

```toml
name = "portal"
pages_build_output_dir = "public"
compatibility_date = "2024-09-23"
compatibility_flags = ["nodejs_compat"]

[[kv_namespaces]]
binding = "PORTAL_KV"
id = "REPLACE_WITH_KV_NAMESPACE_ID"
```

- [ ] **Step 2: Note local dev caveat in commit body and commit**

`RP_ID`/`RP_ORIGIN`/`SESSION_SECRET` are set as Pages env vars in the dashboard (and via a local `.dev.vars` file for `wrangler pages dev`, which is gitignored). For local passkey testing use `RP_ID=localhost`, `RP_ORIGIN=http://localhost:8788`.

```bash
git add wrangler.toml
git commit -m "chore: wrangler Pages + KV config"
```

### Task 16: `CONVENTIONS.md`

**Files:**
- Create: `CONVENTIONS.md`

- [ ] **Step 1: Create `CONVENTIONS.md`**

````markdown
# Portal Conventions

## Add a project to the portal

1. In the project repo root, create `portal.json`:

```json
{
  "name": "100 Hole Day",
  "icon": "⛳",
  "group": "Golf",
  "outputs": [
    { "title": "Live Tracker", "path": "output/index.html" },
    { "title": "Course Map", "path": "output/map.html", "icon": "🗺️" }
  ]
}
```

- `name` — project display name. `icon` — emoji (default) or relative image path.
- `group` — section label on the landing page (defaults to "Other").
- `outputs[].path` — repo-relative path to the entry HTML. The **whole folder**
  containing it is copied, so keep each output self-contained with **relative**
  asset paths.

2. From the portal repo: `npm run build` (icons + sync), then commit & push.
   Cloudflare Pages auto-deploys.

## Hosting / auth setup (one-time)

- Cloudflare Pages project connected to this repo; build command `npm run build`,
  output dir `public`.
- KV namespace bound as `PORTAL_KV` (id in `wrangler.toml`).
- Env vars: `RP_ID`, `RP_ORIGIN`, `SESSION_SECRET`.
- First visit → "Register this device" (Touch/Face ID). After that, opening the
  app prompts Face ID to unlock.

## Local development

```bash
echo -e "RP_ID=localhost\nRP_ORIGIN=http://localhost:8788\nSESSION_SECRET=dev-secret" > .dev.vars
npm run build && npm run dev   # wrangler pages dev on :8788
```
````

- [ ] **Step 2: Add `.dev.vars` to `.gitignore` and commit**

```bash
printf "\n.dev.vars\n" >> .gitignore
git add CONVENTIONS.md .gitignore
git commit -m "docs: portal conventions"
```

### Task 17: `portal-output` skill for future sessions

**Files:**
- Create: `.claude/skills/portal-output/SKILL.md`

- [ ] **Step 1: Create `.claude/skills/portal-output/SKILL.md`**

```markdown
---
name: portal-output
description: Use when building an HTML mockup, infographic, dashboard, or any viewable static output in a project that should appear in Taylor's phone Portal. Ensures the output is self-contained and self-registers via portal.json.
---

# Portal-Compatible Output

When you produce a viewable artifact (HTML page, infographic, dashboard):

1. **Make it self-contained.** All assets (CSS/JS/images) live alongside the
   entry HTML and are referenced with **relative** paths. No absolute `/...`
   paths, no localhost-only dependencies.

2. **Register it.** Create or update `portal.json` in the project repo root:

   ```json
   {
     "name": "<Project Name>",
     "icon": "<emoji>",
     "group": "<section>",
     "outputs": [
       { "title": "<Output Name>", "path": "<relative/path/to/entry.html>" }
     ]
   }
   ```

   Add a new entry to `outputs[]` for each variant/version rather than
   overwriting — the Portal shows them side by side.

3. Tell Taylor to run `npm run build` in the `portal` repo and push to deploy.

See `portal/CONVENTIONS.md` for the full schema.
```

- [ ] **Step 2: Commit**

```bash
git add .claude/skills/portal-output/SKILL.md
git commit -m "feat: portal-output skill for future sessions"
```

### Task 18: End-to-end with a real project + local auth smoke test

**Files:**
- Create: `portal.json` in a real sibling project (start with `../hundred-hole-day/`)

- [ ] **Step 1: Add `portal.json` to `hundred-hole-day`**

Inspect `../hundred-hole-day/output/` for the real entry filename first, then create `../hundred-hole-day/portal.json` (adjust `path` to match what's actually there):

```json
{
  "name": "100 Hole Day",
  "icon": "⛳",
  "group": "Golf",
  "outputs": [
    { "title": "Tracker", "path": "output/index.html" }
  ]
}
```

- [ ] **Step 2: Build and run locally**

Run:
```bash
npm run build
echo -e "RP_ID=localhost\nRP_ORIGIN=http://localhost:8788\nSESSION_SECRET=dev-secret" > .dev.vars
npm run dev
```
Expected: `npm run build` reports the synced project; `wrangler pages dev` serves on `:8788`.

- [ ] **Step 3: Manually verify the full flow**

In a browser at `http://localhost:8788`:
- You are redirected to `/login.html`.
- Click "Register this device" → complete Touch ID → you land on the grid.
- The "100 Hole Day" tile appears under "Golf" and opens the tracker.
- Reload after clearing the cookie → redirected to login, "Unlock" prompts Touch ID.

Expected: all four behaviors hold. If registration 403s, the KV already has a credential — clear it with `wrangler kv key delete --binding PORTAL_KV credential` (local).

- [ ] **Step 4: Run the full test suite**

Run: `npm test`
Expected: PASS — all `node --test` suites (slugify, discover, manifest, session) green.

- [ ] **Step 5: Commit (portal repo) and note the project repo change**

The `portal.json` lives in the `hundred-hole-day` repo — commit it there separately. In the portal repo there's nothing new to commit unless tracked files changed.

```bash
cd ../hundred-hole-day && git add portal.json && git commit -m "feat: register in portal" && cd -
```

### Task 19: Deploy to Cloudflare Pages

- [ ] **Step 1: First deploy**

Follow `CONVENTIONS.md` one-time setup: create the Pages project (connect repo, build command `npm run build`, output `public`), create the KV namespace and put its id in `wrangler.toml`, set `RP_ID`/`RP_ORIGIN`/`SESSION_SECRET` in the Pages dashboard. Push `main`.

Expected: Pages builds and deploys; visiting the production URL redirects to login.

- [ ] **Step 2: Register on the phone & install**

On the phone: open the URL, "Register this device" (Face ID), then Share → Add to Home Screen. Confirm the TA icon appears and the app launches full-screen and prompts Face ID.

Expected: app-like launch, Face ID unlock, branded grid with the 100 Hole Day tile.

---

## Self-Review

**Spec coverage:**
- Cloud static hosting (Cloudflare Pages) → Tasks 15, 19. ✓
- Passkey/Face-ID auth → Tasks 10–14, 19. ✓
- Per-project `portal.json` + sync script → Tasks 3–6. ✓
- Manual refresh model → `npm run build` (Task 1 scripts), CONVENTIONS Task 16. ✓
- Multiple outputs per project → manifest + landing render (Tasks 5, 7); dedupe test. ✓
- Branding/visual identity (TA monogram, Apple-esque + tamed 538, consistent tiles) → Tasks 2, 7, 9. ✓
- Consistent project icon treatment → tile styling Task 7 (uniform `.tile-icon` shell). ✓
- App icon at PWA/iOS sizes → Task 9 + manifest Task 8. ✓
- Conventions doc + skill → Tasks 16, 17. ✓
- Error handling (bad json, missing path, dupes, stale) → discover Task 4, sync wipe Task 6, dedupe Task 5. ✓
- Testing (unit + manual e2e) → Tasks 3–6, 10 unit; Task 18 e2e. ✓

**Placeholder scan:** Only intentional external value `REPLACE_WITH_KV_NAMESPACE_ID` (real id assigned at setup, called out in Tasks 15/19). No TODO/TBD in code steps. ✓

**Type consistency:** `slugify`/`dedupe`, `discoverProjects → {projects,warnings}`, `buildManifest → {manifest,copies}`, `signSession`/`verifySession`, cookie name `portal_session`, KV keys `credential`/`reg-challenge`/`auth-challenge`, env `RP_ID`/`RP_ORIGIN`/`SESSION_SECRET`, `PORTAL_KV` — used consistently across tasks. ✓
```
