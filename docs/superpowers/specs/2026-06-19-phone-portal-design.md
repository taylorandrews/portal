# Phone Portal — Design Spec

**Date:** 2026-06-19
**Status:** Approved (design); pending implementation plan

## Problem

Many sibling Claude Code projects (`hundred-hole-day`, `sabbatical`, `spotify`,
`disc-golf`, an upcoming World Cup infographic, etc.) produce outputs that
manifest as HTML pages or other static artifacts, typically viewed on
`localhost`. There is no systematic, phone-friendly way to browse them.

We want a single "portal": an app-like landing page on the phone that lists
project outputs as icons/tiles, opening each in the browser. It must be reachable
anywhere, feel like an app, and be private — gated by a Face ID scan on open.

## Goals

- One landing page that aggregates outputs from many independent project repos.
- Phone-first, app-like experience (home-screen icon, full-screen launch).
- Reachable anywhere, even when the Mac is off.
- Private: opening it requires only a Face ID scan (no password typing).
- A single project can expose multiple outputs (e.g. several variants of one
  infographic).
- A documented convention + skill so future Claude sessions produce
  portal-compatible outputs automatically.

## Non-Goals

- No always-on local server or daemon.
- No live/dynamic backends per project — outputs are self-contained static files.
- No multi-user support; this is a single-user (Taylor) portal.
- No automated CI beyond Cloudflare Pages' built-in deploy-on-push.

## Decisions (from brainstorming)

| Decision        | Choice                                                        |
|-----------------|--------------------------------------------------------------|
| Hosting         | Cloud static hosting — **Cloudflare Pages**                   |
| Privacy / auth  | **Passkey** gate → Face ID on open (no password typing)      |
| Content sync    | **Per-project `portal.json` convention + sync script**       |
| Refresh model   | Manual `npm run sync` → commit → push → auto-deploy           |

## Architecture

```
your projects/                          portal/ (this repo)
  hundred-hole-day/  ──portal.json──┐
  sabbatical/        ──portal.json──┤   scripts/sync.mjs  ──┐
  spotify/           ──portal.json──┤                       ├─> public/
  world-cup/         ──portal.json──┘                       │     <slug>/...   (copied outputs)
                                                            │     manifest.json
                                                            │     index.html   (landing page)
                                                            └─> git push → Cloudflare Pages deploy
```

Project repos stay independent. The portal repo is the only thing deployed.

## Components

### 1. Per-project convention: `portal.json`

A project opts into the portal by adding `portal.json` at its repo root:

```json
{
  "name": "100 Hole Day",
  "icon": "⛳",
  "group": "Golf",
  "outputs": [
    { "title": "Live Tracker", "path": "output/index.html" },
    { "title": "Course Map",  "path": "output/map.html", "icon": "🗺️" }
  ]
}
```

- `name` — display name of the project tile/section.
- `icon` — emoji (default; zero design work) or a relative image path.
- `group` — optional grouping label on the landing page (e.g. "Golf").
- `outputs[]` — one entry per viewable artifact:
  - `title` — display name of the output.
  - `path` — repo-relative path to the entry HTML file.
  - `icon` — optional per-output icon override.

Constraints:
- Each output must be **self-contained static files** using **relative** asset
  paths, so it works when copied under a different base path.
- The sync script copies the **entire directory** containing each output's entry
  file (so co-located assets come along).

### 2. Sync script — `scripts/sync.mjs`

Run via `npm run sync`. Steps:

1. Scan `../*/portal.json` across the sibling projects folder
   (`/Users/taylor/Documents/projects/coding-fun/`).
2. For each output, copy its directory into `public/<project-slug>/<output-slug>/`.
3. Generate `public/manifest.json` describing all projects, groups, outputs, and
   their deployed paths + icons.
4. Report what was synced. The user then commits + pushes; Cloudflare Pages
   auto-deploys.

Slugs are derived from `name`/`title` (kebab-cased, de-duplicated).

### 3. Landing page — `public/index.html`

- Single static page; fetches `manifest.json` and renders an **icon grid grouped
  by project/group**.
- **PWA**: web app manifest + service worker so "Add to Home Screen" yields a
  real app icon and full-screen (standalone) launch.
- Tapping a tile opens that output. Visual styling finalized at build time
  (mockups during implementation).

### 4. Auth — passkey gate (Face ID)

**Recommended:** a passkey gate built with **Cloudflare Pages Functions** +
WebAuthn:
- Register the passkey once.
- On open, the gate verifies the passkey (iOS satisfies it with Face ID) and
  sets a short-lived signed session cookie.
- Cookie TTL tuned so it re-challenges on open per Taylor's preference.

**Fallback (lower effort):** **Cloudflare Access** in front of the site. Less
code, but passkey behavior / re-challenge frequency is less tunable and first
setup may involve an email step.

> Implementation note: exact WebAuthn details (library, e.g. `@simplewebauthn/*`,
> credential storage via KV, cookie signing) to be confirmed during
> implementation rather than assumed here.

### 5. Convention docs + skill

- `CONVENTIONS.md` in this repo: the `portal.json` schema, the self-contained
  static-output requirement, and how to run sync.
- A small reusable skill so a future Claude session asked to "make a mockup for
  X" knows to produce self-contained static output and drop a `portal.json` so it
  self-registers in the portal.

## Data flow

1. A project produces a self-contained static output + `portal.json`.
2. `npm run sync` aggregates outputs into `public/` and regenerates
   `manifest.json`.
3. Commit + push → Cloudflare Pages builds/deploys.
4. Phone opens the PWA → passkey/Face ID gate → landing page → tap a tile →
   output opens.

## Error handling / edge cases

- `portal.json` missing/invalid JSON → skip with a clear warning; don't fail the
  whole sync.
- Output `path` not found → warn and skip that output.
- Duplicate slugs → de-duplicate deterministically (suffix).
- Stale outputs (project removed) → sync rebuilds `public/` so removed projects
  drop out; consider clearing generated output dirs each run.

## Testing

- Unit-test the sync script's manifest generation and slugging with a couple of
  fixture `portal.json` files + fake output dirs.
- Manually verify: a real project (e.g. `hundred-hole-day`) appears, deploys, and
  opens correctly on the phone with the passkey gate.

## Open questions (resolve during implementation)

- Exact WebAuthn implementation + session TTL.
- Landing-page visual design (mockups during build).
- Whether generated `public/<slug>/` dirs are committed or built fresh on deploy.
