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
  asset paths. The entry **must live in a dedicated subdirectory** (e.g.
  `output/index.html`), never at the repo root — sync copies the entry's folder,
  so a root-level entry would copy the entire repo (including `.git`). Outputs
  with a root-level path or a `..` in the path are skipped with a warning.

2. From the portal repo: `npm run build` (icons + sync), then commit & push.
   Cloudflare Pages auto-deploys.

## Deploy model

Content is built **locally** (the sibling project repos only exist on the Mac,
not on Cloudflare's build servers), committed, and pushed. Cloudflare serves the
committed `public/` and auto-deploys on push.

```bash
npm run build            # icons + sync (reads ../*/portal.json)
git add -A && git commit -m "update portal"
git push                 # → Cloudflare auto-deploys
```

> ⚠️ On Cloudflare, leave the **build command empty**. Do NOT set it to
> `npm run build` — that would run `sync` with no sibling repos present and wipe
> the committed content.

## Hosting / auth setup (one-time)

- Cloudflare Pages project connected to this repo (production branch `main`);
  **build command: empty**, build output directory: `public`.
- KV namespace `portal` bound as `PORTAL_KV`.
- Env vars: `RP_ID` (your domain, e.g. `portal.pages.dev` host), `RP_ORIGIN`
  (full origin, e.g. `https://portal.pages.dev`), `SESSION_SECRET` (random 32+
  bytes).
- First visit → "Register this device" (Touch/Face ID). After that, opening the
  app prompts Face ID to unlock.

## Local development

```bash
echo -e "RP_ID=localhost\nRP_ORIGIN=http://localhost:8788\nSESSION_SECRET=dev-secret" > .dev.vars
npm run build && npm run dev   # wrangler pages dev on :8788
```
