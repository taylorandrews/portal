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
