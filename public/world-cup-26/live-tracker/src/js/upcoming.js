import { DATA } from '../data/fixtures.js';

/* ============================================================
   SECTION 0: "Around now" — a snapshot of the matches people
   are talking about: yesterday, today, and the next two days.
   Dates in fixtures are "Mon DD" (no year) — assumed 2026.
   The window is anchored to the *real* current date so the
   block stays live on a phone without any edits.
   ============================================================ */

const MONTHS = {Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11};

function parseMd(md, year = 2026){
  const [mon, day] = md.split(' ');
  return new Date(year, MONTHS[mon], parseInt(day, 10));
}
function dayKey(d){ return d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate(); }
function startOfToday(){
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

// "Today" / "Yesterday" / "Tomorrow" / weekday for anything else
function relWord(offset){
  if(offset === 0) return 'Today';
  if(offset === -1) return 'Yesterday';
  if(offset === 1) return 'Tomorrow';
  return null;
}

function flattenMatches(){
  const all = [];
  DATA.forEach(g => g.matches.forEach(m => {
    const d = parseMd(m.md);
    all.push({
      d, key: dayKey(d), g: g.g, hn: g.teams[m.h], an: g.teams[m.a],
      h: m.h, a: m.a, score: m.score, kc: m.kc, md: m.md
    });
  }));
  return all;
}

function matchRow(m){
  const kc = m.kc ? '<span class="up-kc">KC</span>' : '';
  const mid = m.score
    ? `<span class="up-sc">${m.score[0]}–${m.score[1]}</span>`
    : `<span class="up-vs">v</span>`;
  const done = m.score ? ' done' : '';
  return `<div class="up-m${done}">
    <span class="up-gp" style="background:var(--g${m.g}0)">${m.g}</span>
    <span class="up-teams">
      <span class="up-tn">${m.hn}</span>${mid}<span class="up-tn">${m.an}</span>
    </span>
    ${kc}
  </div>`;
}

function dayCard(d, offset, matches){
  const word = relWord(offset);
  const date = d.toLocaleDateString('en-US', {weekday:'short', month:'short', day:'numeric'});
  const isToday = offset === 0;
  const title = word || d.toLocaleDateString('en-US', {weekday:'long'});
  return `<div class="up-day${isToday ? ' today' : ''}">
    <div class="up-day-h"><span>${title}</span><span class="date">${date}</span></div>
    <div class="up-day-b">${matches.map(matchRow).join('')}</div>
  </div>`;
}

export function renderUpcoming(){
  const today = startOfToday();
  const MS = 86400000;
  const all = flattenMatches();
  const byKey = {};
  all.forEach(m => (byKey[m.key] = byKey[m.key] || []).push(m));

  // Primary window: yesterday → +2 days, anchored to the real date.
  let days = [-1, 0, 1, 2]
    .map(off => ({off, d: new Date(today.getTime() + off * MS)}))
    .filter(x => byKey[dayKey(x.d)]);

  // Fallback: nothing in the window (off day / before kickoff / between
  // group stage and knockouts) → show the next few upcoming match-days.
  if(days.length === 0){
    const future = all
      .filter(m => m.d >= today && !m.score)
      .sort((a, b) => a.d - b.d);
    const seen = [];
    for(const m of future){
      if(!seen.includes(m.key)) seen.push(m.key);
      if(seen.length >= 3) break;
    }
    days = seen.map(k => {
      const d = byKey[k][0].d;
      return {off: Math.round((d - today) / MS), d};
    });
  }

  const inner = days.length
    ? `<div class="up-days">${
        days.map(x => dayCard(x.d, x.off, byKey[dayKey(x.d)])).join('')
      }</div>`
    : `<div class="up-empty">No matches scheduled around now — check the bracket below.</div>`;

  return `
  <section class="upcoming">
    <div class="up-head">
      <h2 class="up-title">Around now</h2>
      <span class="up-sayswho">Yesterday · today · next two days</span>
    </div>
    ${inner}
  </section>`;
}
