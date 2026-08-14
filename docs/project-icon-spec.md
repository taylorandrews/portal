# Portal project icons

Every project in the portal ships one icon. The portal draws the tile; the icon
file draws what sits on it. Two layers, nothing else.

## The file

`public/icons/projects/<slug>.svg` — 64×64 viewBox, transparent, no CSS, no
classes. Start from `_template.svg`.

```
<svg viewBox="0 0 64 64">
  <g fill="none" stroke="#968ae0" stroke-width="2.2" opacity=".45">  <!-- motif -->
  <g transform="translate(32 32) scale(.5625) translate(-32 -32)">    <!-- glyph -->
```

### Layer 1 — the motif (background)

A line drawing from the project's own content, filling the whole 64×64 field and
free to bleed past the edges (the tile clips it).

- Stroke `#968ae0`, width `2.2`, opacity `.45`. Nothing thicker, nothing
  brighter, no second weight for emphasis.
- **Strokes only.** No filled shapes, no shaded cells.
- Loose and irregular beats a repeating pattern; no line should end next to an
  edge of the glyph, and none should sit tight against the bottom.
- Existing motifs: ruled sheet lines (Ballot), one line orbiting inward a turn
  and a quarter (Sabbatical), three vertical cost-over-time lines (Utilities),
  midfield line and two eighteen-yard boxes (World Cup 26).

### Layer 2 — the glyph (subject)

The object itself, drawn on the 64 grid inside 12–52, then scaled to 0.5625
about the centre by the transform above — so author it full size and let the
transform place it.

- Structure: `#cfd3e5`, stroke width `3`, round caps and joins, no fills.
- **Exactly one solid triangle**, filled `#b5abfc` — the family signature. It
  has to earn its place: a folded ballot corner, a summit cap, a meter needle, a
  ball panel. One per icon, never two, never zero.
- Must survive 22px. If it needs a fourth line to read, cut something.

## Registering it

In the project repo's `portal.json`:

```json
{
  "name": "100 Hole Day",
  "icon": "portal/icon.svg",
  "outputs": [{ "title": "Live Tracker", "path": "output/index.html" }]
}
```

- `icon` — repo-relative path to the SVG (an emoji still works as a fallback and
  renders on the plain tile).
- `group` is no longer used. The landing page is one flat grid; every project is
  a peer carrying its name as its label.
- `angle` — optional gradient tilt in degrees. Omit it: the portal derives a
  stable angle from the slug, so a new project lands with its own tilt and still
  matches the set.

If no icon file resolves, the tile falls back to the emoji — the page never
breaks, it just looks unfinished, which is the right pressure.

## Colours

| Role | Value |
| --- | --- |
| Motif line | `#968ae0` at .45 |
| Glyph structure | `#cfd3e5` |
| Signature triangle | `#b5abfc` |
| Tile ground | `#35305a` → `#1a1c29` (portal-drawn) |

No other colours. Personality comes from the drawing, not from hue.
