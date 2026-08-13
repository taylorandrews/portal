// Vertical curved stacked-area chart from real bills.
import { UTILITIES, COLORS, dailySeries } from "./lib/compute.js";

// Aggregate the daily series to one point per month (mean daily rate that month)
// for a smooth, readable curve; keeps the true seasonal shape.
function monthlyPoints(bills) {
  const series = dailySeries(bills);
  const buckets = new Map();
  for (const row of series) {
    const m = row.date.slice(0, 7);
    if (!buckets.has(m)) buckets.set(m, { n: 0, sum: { Internet: 0, Water: 0, Gas: 0, Electric: 0 } });
    const bkt = buckets.get(m); bkt.n++;
    for (const u of UTILITIES) bkt.sum[u] += row[u];
  }
  return [...buckets.entries()].map(([m, { n, sum }]) => {
    const p = { month: m }; for (const u of UTILITIES) p[u] = sum[u] / n; return p;
  });
}

function smooth(points) {
  if (points.length < 2) return "";
  let d = `M ${points[0][0].toFixed(1)},${points[0][1].toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i], p1 = points[i], p2 = points[i + 1], p3 = points[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}

export function renderChart(el, bills) {
  const pts = monthlyPoints(bills);
  if (!pts.length) { el.innerHTML = `<div class="stat-card">No data yet.</div>`; return; }
  const W = 320, rowH = 48, top = 14, bottom = 18;
  const H = top + bottom + rowH * (pts.length - 1);
  const M = 42, plotW = W - M - 12;
  const totals = pts.map((p) => UTILITIES.reduce((a, u) => a + p[u], 0));
  const axisMax = Math.ceil(Math.max(...totals) / 5) * 5 || 5;
  const y = (i) => top + (i / (pts.length - 1 || 1)) * (H - top - bottom);
  const xs = (v) => M + (v / axisMax) * plotW;

  const cum = pts.map((p) => { const c = [0]; for (const u of UTILITIES) c.push(c[c.length - 1] + p[u]); return c; });
  const layerPts = (layer) => pts.map((_, i) => [xs(cum[i][layer]), y(i)]);
  let bands = "";
  UTILITIES.forEach((u, layer) => {
    const L = layerPts(layer), R = layerPts(layer + 1).reverse();
    bands += `<path d="${smooth(L)} L ${smooth(R).slice(1)} Z" fill="${COLORS[u]}" opacity="0.92"/>`;
  });
  let grid = "", ticks = "";
  for (let t = 5; t <= axisMax; t += 5) {
    const x = xs(t);
    grid += `<line x1="${x.toFixed(1)}" y1="${top}" x2="${x.toFixed(1)}" y2="${H - bottom}" stroke="#fff" stroke-width="0.75" stroke-dasharray="2 5" opacity="0.28"/>`;
    ticks += `<div style="position:absolute;left:${(x / W * 100).toFixed(2)}%;transform:translateX(-50%);text-align:center">
      <div style="font-weight:600;font-size:12px">$${t}<span style="color:var(--dim);font-weight:400">/day</span></div>
      <div style="color:var(--dim);font-size:9px">~$${Math.round(t * 30.4)}/mo</div></div>`;
  }
  const months = pts.map((p, i) => {
    const lbl = new Date(p.month + "-01T00:00:00Z").toLocaleString(undefined, { month: "short", year: "2-digit", timeZone: "UTC" });
    return `<text x="2" y="${(y(i) + 3).toFixed(1)}" fill="var(--dim)" font-size="8">${lbl}</text>`;
  }).join("");

  el.innerHTML = `
    <div class="legend" style="display:flex;gap:14px;justify-content:center;margin:4px 0 12px;font-size:13px">
      ${UTILITIES.map((u) => `<span style="color:${COLORS[u]}">■ ${u}</span>`).join("")}
    </div>
    <div style="border:1px solid var(--line);border-radius:14px;overflow:hidden;background:var(--bg)">
      <div style="position:sticky;top:52px;z-index:5;background:var(--bg);border-bottom:1px solid var(--line)">
        <div style="position:relative;height:40px">${ticks}</div>
      </div>
      <svg viewBox="0 0 ${W} ${H}" style="width:100%;display:block">${bands}${grid}${months}</svg>
    </div>`;
}
