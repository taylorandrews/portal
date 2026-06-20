# Disc Golf Road Trip Map — Sabbatical 2026

An interactive map of the summer disc golf road trip from **Buena Vista, CO** to
**Kansas City, MO**. The route follows real roads (driving directions), and the
map is styled dark + minimal so it can grow into a digital art visual later.

Same GPX/GeoJSON backbone as the `sloans-lake` project, but rendered with
[Leaflet](https://leafletjs.com/) instead of gmplot — no Google Maps API key
needed, and far more control over styling for the art piece.

## How It Works

1. `stops.json` defines the ordered list of stops (start, end, and any disc
   golf courses / overnight stops you add).
2. `build_route.py` asks the public [OSRM](http://project-osrm.org/) routing API
   for driving geometry through those stops, then writes:
   - `route.geojson` — the driving line + a point per stop (used by the map)
   - `route.gpx` — the same route as a GPX track + waypoints (for other tools)
3. `index.html` loads `route.geojson` and draws it on a dark Leaflet map.

> **Note:** `build_route.py` uses only the Python standard library — no
> `pip install` required. It does need an internet connection to reach OSRM.

## Quick Start

```bash
cd road-trip-map

# 1. Generate route.geojson + route.gpx (already committed; re-run after edits)
python3 build_route.py

# 2. Serve the folder so the browser can fetch route.geojson
python3 -m http.server 8000
```

Then open <http://localhost:8000> in your browser.

> Opening `index.html` directly (file://) won't work — browsers block `fetch()`
> of local files, so you need the little `http.server`.

## Adding Disc Golf Course Stops

Edit `stops.json` and insert stops **in travel order** between the start and end.
Each stop needs a name and coordinates:

```json
{
  "name": "Widefield DGC, Colorado Springs",
  "lat": 38.7531,
  "lon": -104.7191,
  "type": "course",
  "day": 1,
  "notes": "18 holes, morning round"
}
```

- `type` — `start`, `end`, `course`, `overnight`, etc. (free text; endpoints
  render slightly larger on the map).
- `day` / `notes` — optional, shown in the marker popup.

To find coordinates: right-click a spot in Google Maps → click the lat/lon to
copy. Then re-run `python3 build_route.py` to reroute through the new stops.

## Files

```
stops.json        # Trip definition — edit this, then rebuild
build_route.py    # Fetches driving route, writes route.geojson + route.gpx
route.geojson     # Generated — driving line + stop points (map reads this)
route.gpx         # Generated — GPX track + waypoints
index.html        # Leaflet map (dark, art-leaning styling)
```

## Toward the Art Project

A few directions the current setup leaves open:

- **Restyling** — colors and basemap dimming live in the `:root` / `.leaflet-tile`
  CSS at the top of `index.html`. Swap the Carto `dark_all` tile URL for
  `light_all`, a watercolor tileset, or drop tiles entirely for a pure
  line-on-black piece.
- **Animation** — `route.geojson` is an ordered LineString, so an animated
  "draw the route" reveal is straightforward (e.g. progressively slicing the
  coordinate array, or a leaflet polyline-decorator).
- **Elevation / day segmentation** — `stops.json` already carries `day`, so the
  route can later be split and colored per travel day.
- **Print/export** — the dark map exports cleanly to a screenshot or, with a
  little work, to SVG for large-format printing.
