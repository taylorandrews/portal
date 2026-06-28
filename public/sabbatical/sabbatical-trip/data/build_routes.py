"""
Route each per-day driving segment in segments.json through OSRM and write
route_segments.geojson:

  - one LineString feature per segment  (properties: date, label, miles, hours)
  - one Point feature per named waypoint (properties: name, date, play, note)

The web page (../index.html) draws the lines (dim by default) and lights up the
segment whose `date` matches a hovered calendar day. Standard library only.
"""

import json
import os
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "segments.json")
OUT = os.path.join(HERE, "route_segments.geojson")
OSRM = "http://router.project-osrm.org/route/v1/driving/"


def route(waypoints):
    coords = ";".join(f"{w['lon']},{w['lat']}" for w in waypoints)
    url = f"{OSRM}{coords}?overview=full&geometries=geojson"
    with urllib.request.urlopen(url, timeout=60) as r:
        data = json.load(r)
    if data.get("code") != "Ok":
        raise SystemExit(f"OSRM error on {waypoints}: {data.get('code')}")
    rt = data["routes"][0]
    return rt["geometry"]["coordinates"], rt["distance"], rt["duration"]


def main():
    segments = json.load(open(SRC))["segments"]
    features = []
    seen_points = {}
    total_mi = 0.0
    for seg in segments:
        coords, dist, dur = route(seg["waypoints"])
        mi = dist / 1609.344
        total_mi += mi
        features.append({
            "type": "Feature",
            "properties": {
                "kind": "drive",
                "date": seg["date"],
                "label": seg["label"],
                "miles": round(mi, 1),
                "hours": round(dur / 3600, 1),
            },
            "geometry": {"type": "LineString", "coordinates": coords},
        })
        print(f"{seg['date']}  {seg['label']:46} {mi:6.0f} mi  {dur/3600:4.1f} hr")
        # one point per unique location; keep the earliest date it's visited
        for w in seg["waypoints"]:
            key = (round(w["lat"], 4), round(w["lon"], 4))
            if key in seen_points:
                continue
            seen_points[key] = True
            features.append({
                "type": "Feature",
                "properties": {
                    "kind": "course" if w.get("play") else ("camp" if w.get("camp") else "place"),
                    "name": w["name"],
                    "date": seg["date"],
                    "play": bool(w.get("play")),
                    "camp": bool(w.get("camp")),
                    "note": w.get("note", ""),
                },
                "geometry": {"type": "Point", "coordinates": [w["lon"], w["lat"]]},
            })

    fc = {"type": "FeatureCollection", "features": features}
    with open(OUT, "w") as f:
        json.dump(fc, f)
    drives = sum(1 for s in segments)
    print(f"\n{drives} driving days · {total_mi:,.0f} total miles")
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
