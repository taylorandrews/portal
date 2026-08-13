// Pure utility-cost math. NO imports (runs in browser and Node identically).
// Keep byte-identical with PORTAL/functions/lib/utilities.compute.js.
export const UTILITIES = ["Internet", "Water", "Gas", "Electric"];
export const COLORS = { Internet: "#4f9dde", Water: "#3fc4c4", Gas: "#e8a13a", Electric: "#e0574b" };
const DAY = 86400000;

const asUTC = (iso) => { const [y, m, d] = iso.split("-").map(Number); return Date.UTC(y, m - 1, d); };
const toISO = (ms) => new Date(ms).toISOString().slice(0, 10);

export function daysInclusive(start, end) {
  return Math.round((asUTC(end) - asUTC(start)) / DAY) + 1;
}
export function dailyRate(bill) {
  return bill.amount / daysInclusive(bill.start, bill.end);
}

// [{date, Internet, Water, Gas, Electric, total}] over the full span of bills.
export function dailySeries(bills) {
  if (!bills.length) return [];
  const min = Math.min(...bills.map((b) => asUTC(b.start)));
  const max = Math.max(...bills.map((b) => asUTC(b.end)));
  const rows = [];
  for (let t = min; t <= max; t += DAY) {
    const row = { date: toISO(t), Internet: 0, Water: 0, Gas: 0, Electric: 0, total: 0 };
    for (const b of bills) {
      if (t >= asUTC(b.start) && t <= asUTC(b.end)) {
        const r = dailyRate(b); row[b.utility] += r; row.total += r;
      }
    }
    rows.push(row);
  }
  return rows;
}

function latestPerUtility(bills) {
  const latest = {};
  for (const b of bills) {
    if (!latest[b.utility] || b.end > latest[b.utility].end) latest[b.utility] = b;
  }
  return latest;
}

export function currentRunRate(bills) {
  const latest = latestPerUtility(bills);
  const perUtility = {};
  let perDay = 0;
  for (const u of UTILITIES) {
    const r = latest[u] ? dailyRate(latest[u]) : 0;
    perUtility[u] = r; perDay += r;
  }
  return { perDay, perMonth: Math.round(perDay * 30.4 * 100) / 100, perUtility };
}

// Sum each bill's dailyRate * (days of the bill inside [asOf-365, asOf]).
export function trailing12(bills, asOfISO) {
  const asOf = asUTC(asOfISO);
  const from = asOf - 364 * DAY; // inclusive 365-day window
  const byUtility = { Internet: 0, Water: 0, Gas: 0, Electric: 0 };
  for (const b of bills) {
    const s = Math.max(asUTC(b.start), from), e = Math.min(asUTC(b.end), asOf);
    if (e < s) continue;
    const days = Math.round((e - s) / DAY) + 1;
    byUtility[b.utility] += dailyRate(b) * days;
  }
  const total = Object.values(byUtility).reduce((a, x) => a + x, 0);
  const shares = {};
  for (const u of UTILITIES) shares[u] = total ? byUtility[u] / total : 0;
  return { byUtility, total, shares };
}

export function highsLows(bills, asOfISO) {
  const t = trailing12(bills, asOfISO);
  const ranked = UTILITIES.map((u) => ({ utility: u, total: t.byUtility[u] }))
    .filter((x) => x.total > 0).sort((a, b) => b.total - a.total);
  const months = {};
  for (const row of dailySeries(bills)) {
    const m = row.date.slice(0, 7);
    months[m] = (months[m] || 0) + row.total;
  }
  const mRanked = Object.entries(months).map(([month, total]) => ({ month, total }))
    .sort((a, b) => b.total - a.total);
  return {
    utilityHigh: ranked[0] || null, utilityLow: ranked[ranked.length - 1] || null,
    monthHigh: mRanked[0] || null, monthLow: mRanked[mRanked.length - 1] || null,
  };
}

export function startAutofill(bills, utility) {
  const ends = bills.filter((b) => b.utility === utility).map((b) => b.end).sort();
  if (!ends.length) return null;
  return toISO(asUTC(ends[ends.length - 1]) + DAY);
}

export function mergeBills(seed, overlay) {
  return [...seed, ...overlay].sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0));
}
