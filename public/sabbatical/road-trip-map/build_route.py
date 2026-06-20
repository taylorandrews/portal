"""
Build a driving route through the stops defined in stops.json.

Fetches real road geometry from the public OSRM routing API, then writes:
  - route.geojson  : the driving line + a point for each stop (used by index.html)
  - route.gpx      : the same route as a GPX track + waypoints (for any GPX tool)

Standard library only -- no pip install required. Just:
    python3 build_route.py
"""

import json
import os
import urllib.request
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
STOPS_FILE = os.path.join(HERE, "stops.json")
GEOJSON_OUT = os.path.join(HERE, "route.geojson")
GPX_OUT = os.path.join(HERE, "route.gpx")

OSRM_URL = "http://router.project-osrm.org/route/v1/driving/"


def load_stops():
    with open(STOPS_FILE, "r") as f:
        data = json.load(f)
    stops = data["stops"]
    if len(stops) < 2:
        raise SystemExit("Need at least 2 stops (a start and an end) in stops.json")
    return data, stops


def fetch_route(stops):
    """Ask OSRM for driving geometry through every stop, in order."""
    coord_str = ";".join(f"{s['lon']},{s['lat']}" for s in stops)
    url = f"{OSRM_URL}{coord_str}?overview=full&geometries=geojson"
    print(f"Requesting driving route through {len(stops)} stops...")
    with urllib.request.urlopen(url, timeout=60) as resp:
        data = json.load(resp)
    if data.get("code") != "Ok":
        raise SystemExit(f"OSRM error: {data.get('code')} - {data.get('message')}")
    route = data["routes"][0]
    coords = route["geometry"]["coordinates"]  # [ [lon, lat], ... ]
    print(f"  -> {len(coords)} points, "
          f"{route['distance'] / 1000:.1f} km, "
          f"{route['duration'] / 3600:.1f} hr driving")
    return coords, route["distance"], route["duration"]


def write_geojson(coords, stops, distance_m, duration_s):
    features = [{
        "type": "Feature",
        "properties": {
            "kind": "route",
            "distance_km": round(distance_m / 1000, 1),
            "distance_mi": round(distance_m / 1609.344, 1),
            "duration_hr": round(duration_s / 3600, 2),
        },
        "geometry": {"type": "LineString", "coordinates": coords},
    }]
    for i, s in enumerate(stops):
        features.append({
            "type": "Feature",
            "properties": {
                "kind": "stop",
                "order": i,
                "name": s["name"],
                "type": s.get("type", "stop"),
                "day": s.get("day"),
                "notes": s.get("notes", ""),
            },
            "geometry": {"type": "Point", "coordinates": [s["lon"], s["lat"]]},
        })
    fc = {"type": "FeatureCollection", "features": features}
    with open(GEOJSON_OUT, "w") as f:
        json.dump(fc, f)
    print(f"Wrote {GEOJSON_OUT}")


def write_gpx(coords, stops):
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<gpx version="1.1" creator="road-trip-map" '
        'xmlns="http://www.topografix.com/GPX/1/1">',
        f"  <metadata><time>{now}</time></metadata>",
    ]
    for s in stops:
        lines.append(f'  <wpt lat="{s["lat"]}" lon="{s["lon"]}">')
        lines.append(f"    <name>{_xml(s['name'])}</name>")
        lines.append(f"    <type>{_xml(s.get('type', 'stop'))}</type>")
        lines.append("  </wpt>")
    lines.append("  <trk><name>Disc Golf Road Trip</name><trkseg>")
    for lon, lat in coords:
        lines.append(f'    <trkpt lat="{lat}" lon="{lon}"></trkpt>')
    lines.append("  </trkseg></trk>")
    lines.append("</gpx>")
    with open(GPX_OUT, "w") as f:
        f.write("\n".join(lines))
    print(f"Wrote {GPX_OUT}")


def _xml(text):
    return (str(text).replace("&", "&amp;").replace("<", "&lt;")
            .replace(">", "&gt;").replace('"', "&quot;"))


if __name__ == "__main__":
    meta, stops = load_stops()
    print(f"Trip: {meta.get('trip_name', 'Road Trip')}")
    coords, distance_m, duration_s = fetch_route(stops)
    write_geojson(coords, stops, distance_m, duration_s)
    write_gpx(coords, stops)
    print("Done. Serve the folder and open index.html "
          "(see README.md).")
