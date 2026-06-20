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
