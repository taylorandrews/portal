import { DATA } from '../data/fixtures.js';
import { computeTable } from './standings.js';
import { THIRD_MAP } from '../data/third-place-map.js';



/* ============================================================
   SECTION 2 + 3: Live bracket + third-place ranking
   Recomputes from the SAME DATA object above.
   ============================================================ */

// --- R32 fixed slot definitions (FIFA Annex schedule) ---
// type: 'W'=group winner, 'R'=runner-up, 'T'=third place (resolved via THIRD_MAP)
const R32 = [
  {m:73, home:{t:'R',g:'A'}, away:{t:'R',g:'B'}, venue:'Los Angeles'},
  {m:74, home:{t:'W',g:'E'}, away:{t:'T'},        venue:'Boston'},
  {m:75, home:{t:'W',g:'F'}, away:{t:'R',g:'C'},  venue:'Monterrey'},
  {m:76, home:{t:'W',g:'C'}, away:{t:'R',g:'F'},  venue:'Houston'},
  {m:77, home:{t:'W',g:'I'}, away:{t:'T'},        venue:'New York NJ'},
  {m:78, home:{t:'R',g:'E'}, away:{t:'R',g:'I'},  venue:'Dallas'},
  {m:79, home:{t:'W',g:'A'}, away:{t:'T'},        venue:'Mexico City'},
  {m:80, home:{t:'W',g:'L'}, away:{t:'T'},        venue:'Atlanta'},
  {m:81, home:{t:'W',g:'D'}, away:{t:'T'},        venue:'SF Bay Area'},
  {m:82, home:{t:'W',g:'G'}, away:{t:'T'},        venue:'Seattle'},
  {m:83, home:{t:'R',g:'K'}, away:{t:'R',g:'L'},  venue:'Toronto'},
  {m:84, home:{t:'W',g:'H'}, away:{t:'R',g:'J'},  venue:'Los Angeles'},
  {m:85, home:{t:'W',g:'B'}, away:{t:'T'},        venue:'Vancouver'},
  {m:86, home:{t:'W',g:'J'}, away:{t:'R',g:'H'},  venue:'Miami'},
  {m:87, home:{t:'W',g:'K'}, away:{t:'T'},        venue:'Kansas City', kc:true},
  {m:88, home:{t:'R',g:'D'}, away:{t:'R',g:'G'},  venue:'Dallas'},
];

// Later rounds: each match links winners of two earlier matches.
const LATER = {
  R16:[
    {m:89, a:74, b:77, venue:'Philadelphia'},
    {m:90, a:73, b:75, venue:'Houston'},
    {m:91, a:76, b:78, venue:'New York NJ'},
    {m:92, a:79, b:80, venue:'Mexico City'},
    {m:93, a:83, b:84, venue:'Dallas'},
    {m:94, a:81, b:82, venue:'Seattle'},
    {m:95, a:86, b:88, venue:'Atlanta'},
    {m:96, a:85, b:87, venue:'Vancouver', kc:false},
  ],
  QF:[
    {m:97, a:89, b:90, venue:'Boston'},
    {m:98, a:93, b:94, venue:'Los Angeles'},
    {m:99, a:91, b:92, venue:'Miami'},
    {m:100,a:95, b:96, venue:'Kansas City', kc:true},
  ],
  SF:[
    {m:101,a:97, b:98, venue:'Dallas'},
    {m:102,a:99, b:100,venue:'Atlanta'},
  ],
  F:[
    {m:104,a:101,b:102,venue:'New York NJ', label:'Final'},
  ],
};

// --- helper: get computed table for a group letter ---
function tableFor(letter){
  const grp = DATA.find(g=>g.g===letter);
  return computeTable(grp); // sorted desc
}

// short code for a team (use the 3-letter code from DATA)
function codeName(letter, pos){ // pos 0=winner,1=runner,2=third
  const t = tableFor(letter)[pos];
  return t ? t.code : null;
}
function fullName(letter, pos){
  const t = tableFor(letter)[pos];
  return t ? t.name : null;
}

// has a group finished all 3 rounds? (needed before standings are final)
function groupComplete(letter){
  const grp = DATA.find(g=>g.g===letter);
  return grp.matches.every(x=>x.score);
}
function groupAllSamePlayed(letter){
  // every team played the same number of games (so positions are comparable)
  const tbl = tableFor(letter);
  return tbl.every(t=>t.mp===tbl[0].mp) && tbl[0].mp>0;
}

// --- THIRD-PLACE RANKING (FIFA: pts, GD, GF, [conduct, FIFA rank not modeled]) ---
function thirdPlaceRanking(){
  const rows = [];
  DATA.forEach(grp=>{
    const tbl = computeTable(grp);
    const third = tbl[2];
    if(third && third.mp>0){
      rows.push({
        group:grp.g, code:third.code, name:third.name,
        mp:third.mp, pts:third.pts, gd:third.gf-third.ga, gf:third.gf
      });
    }
  });
  rows.sort((a,b)=> b.pts-a.pts || b.gd-a.gd || b.gf-a.gf || a.group.localeCompare(b.group));
  rows.forEach((r,i)=> r.rank=i+1);
  return rows;
}

// Which 8 groups' thirds qualify, and slot assignment
function thirdAllocation(){
  const ranked = thirdPlaceRanking();
  const qualifiers = ranked.filter(r=>r.rank<=8);
  const key = qualifiers.map(r=>r.group).sort().join('');
  const map = THIRD_MAP[key] || null; // {matchNum: groupLetter}
  // invert: matchNum -> group letter whose third goes there
  return {ranked, qualifiers, key, map, complete: ranked.length===12 && DATA.every(g=>groupComplete(g.g))};
}

// Resolve a slot ref to a display token
function resolveSlot(ref, alloc){
  if(ref.t==='W'){
    const allDone = groupComplete(ref.g);
    const nm = fullName(ref.g,0);
    return {text: nm || ('Winner '+ref.g), code: codeName(ref.g,0), tentative:!allDone, label:'Winner '+ref.g};
  }
  if(ref.t==='R'){
    const allDone = groupComplete(ref.g);
    const nm = fullName(ref.g,1);
    return {text: nm || ('Runner-up '+ref.g), code: codeName(ref.g,1), tentative:!allDone, label:'Runner-up '+ref.g};
  }
  // third place
  if(ref.t==='T'){
    return {text:'3rd place', code:null, tentative:true, third:true};
  }
}

// Resolve the third-place slot for a specific match number, if alloc known
function resolveThirdForMatch(matchNum, alloc){
  if(alloc.map && alloc.map[String(matchNum)]){
    const g = alloc.map[String(matchNum)];
    const nm = fullName(g,2);
    return {text: nm || ('3rd '+g), code: codeName(g,2), tentative:!alloc.complete, label:'3rd Group '+g};
  }
  return {text:'3rd place', code:null, tentative:true, third:true};
}

// Build R32 resolved matches
function buildR32(){
  const alloc = thirdAllocation();
  return R32.map(fx=>{
    const home = fx.home.t==='T' ? resolveThirdForMatch(fx.m,alloc) : resolveSlot(fx.home,alloc);
    const away = fx.away.t==='T' ? resolveThirdForMatch(fx.m,alloc) : resolveSlot(fx.away,alloc);
    return {...fx, home, away};
  });
}


// ---------- helpers for color cells ----------
function posClass(letter, pos){ return {bg:`var(--g${letter}${pos})`, fg:`var(--t${letter}${pos})`}; }

// Build a color group key (legend)
function renderKey(){
  let s = '<div class="key">';
  'ABCDEFGHIJKL'.split('').forEach(g=>{
    s += `<div class="keyg"><b>${g}</b>`;
    for(const p of ['0','1','2','3']){
      s += `<span class="sw" style="background:var(--g${g}${p})"></span>`;
    }
    s += `</div>`;
  });
  s += '</div>';
  return s;
}

// ---------- LIVE BRACKET (real tournament tree) ----------
// Each R32 slot resolves to a {letter,pos,label,tentative} tile. We use the
// 3-letter code as the label so tiles stay legible at phone widths; the color
// (group hue × finish ramp) carries the identity, matching the ranking above.
function slotTile(ref){
  const pos = ref.t==='W' ? 0 : 1;
  const done = groupComplete(ref.g);
  const code = codeName(ref.g, pos);
  const label = code || (ref.t==='W' ? ('Win '+ref.g) : ('2nd '+ref.g));
  return {letter:ref.g, pos, label, tentative:!done};
}
function thirdTile(matchNum, alloc){
  if(alloc.map && alloc.map[String(matchNum)]){
    const g = alloc.map[String(matchNum)];
    const code = codeName(g, 2);
    return {letter:g, pos:2, label: code || ('3rd '+g), tentative:!alloc.complete};
  }
  return {letter:null, pos:2, label:'3rd ?', tentative:true};
}

// One team line inside a bracket card.
function bracketLine(tile){
  if(!tile.letter) return `<div class="ln tbd">${tile.label}</div>`;
  const prov = tile.tentative ? ' prov' : '';
  return `<div class="ln${prov}" style="background:var(--g${tile.letter}${tile.pos});color:var(--t${tile.letter}${tile.pos})">${tile.label}</div>`;
}

// Build a node tree from a root match number, recursing through R16/QF/SF.
function buildBracketTree(rootNum, r32map, defByNum){
  function node(m){
    if(r32map[m]) return {m, leaf:true, ...r32map[m]};
    const d = defByNum[m];
    return {m, kc:d.kc, a:node(d.a), b:node(d.b)};
  }
  return node(rootNum);
}

// DFS pre-order keeps sibling pairs adjacent at every depth, which is exactly
// what the CSS connector lines need. Returns columns leaf→root (R32 … SF).
function bracketLevels(root){
  const lv = [];
  (function walk(n, depth){
    (lv[depth] = lv[depth] || []).push(n);
    if(!n.leaf){ walk(n.a, depth+1); walk(n.b, depth+1); }
  })(root, 0);
  return lv.reverse();
}

const ROUND_LABELS = ['R32','R16','QF','SF'];

function bracketCard(n){
  const kc = n.kc ? '<span class="bkc">KC</span>' : '';
  const head = `<div class="bcard-h"><span>M${n.m}</span>${kc}</div>`;
  const l1 = n.leaf ? bracketLine(n.H) : `<div class="ln tbd">W ${n.a.m}</div>`;
  const l2 = n.leaf ? bracketLine(n.A) : `<div class="ln tbd">W ${n.b.m}</div>`;
  return `<div class="bm"><div class="bcard${n.kc?' kc':''}">${head}${l1}${l2}</div></div>`;
}

function renderHalf(root){
  const levels = bracketLevels(root); // R32, R16, QF, SF
  const cols = levels.map((nodes, ci) => {
    const cards = nodes.map(bracketCard).join('');
    return `<div class="bcol">
      <div class="bcol-h">${ROUND_LABELS[ci] || ''}</div>
      <div class="bcol-body">${cards}</div>
    </div>`;
  }).join('');
  return `<div class="bracket">${cols}</div>`;
}

export function renderMiniBracket(){
  const alloc = thirdAllocation();

  // Resolve every R32 match's two tiles up front.
  const r32map = {};
  R32.forEach(fx => {
    const H = fx.home.t==='T' ? thirdTile(fx.m, alloc) : slotTile(fx.home);
    const A = fx.away.t==='T' ? thirdTile(fx.m, alloc) : slotTile(fx.away);
    r32map[fx.m] = {kc:fx.kc, H, A};
  });
  // Lookup for later-round match definitions.
  const defByNum = {};
  ['R16','QF','SF','F'].forEach(r => LATER[r].forEach(f => (defByNum[f.m] = f)));

  // The final (M104) feeds from the two semi-final winners (M101, M102),
  // which root the top and bottom halves of the draw.
  const finalDef = LATER.F[0];
  const topRoot = buildBracketTree(finalDef.a, r32map, defByNum);
  const botRoot = buildBracketTree(finalDef.b, r32map, defByNum);

  const finalCard = `<div class="bfinal${finalDef.kc?' kc':''}">
    <div class="bfinal-h">Final · Jul 19 · New York NJ</div>
    <div class="bfinal-body">
      <div class="ln tbd">W ${finalDef.a}</div>
      <div class="bfinal-trophy">🏆</div>
      <div class="ln tbd">W ${finalDef.b}</div>
    </div>
  </div>`;

  return `
  <section class="block">
    <h2 class="bigtitle">Live bracket</h2>
    <p class="blurb">The knockout draw as it stands if the group stage ended now. Read it like any bracket — winners flow left to right toward the final. Each tile is tinted by the team's group and finish: dark = group winner, medium = runner-up, light = third place. Faded tiles are provisional (group unfinished or the third-place picture not locked); grey tiles await a knockout result.</p>
    ${renderKey()}
    <div class="bracket-wrap">
      <div class="bhalf">
        <div class="bhalf-h">Top half <span>→ Semi-final M101</span></div>
        <div class="bscroll">${renderHalf(topRoot)}</div>
      </div>
      ${finalCard}
      <div class="bhalf">
        <div class="bhalf-h">Bottom half <span>→ Semi-final M102</span></div>
        <div class="bscroll">${renderHalf(botRoot)}</div>
      </div>
    </div>
    <p class="ranknote brnote">Round of 32: Jun 28 – Jul 3 · Round of 16: Jul 4 – 7 · Quarter-finals: Jul 9 – 11 · Semi-finals: Jul 14 – 15 · Final: Jul 19. Match 87 (R32) and Match 100 (QF) are in Kansas City.</p>
  </section>`;
}

// ---------- FULL 48-TEAM RANKING ----------
// position label per finish
const POS_LABEL = {0:'1st',1:'2nd',2:'3rd',3:'4th'};

export function renderFullRanking(){
  // gather every team with its group + finish position + stats
  const all = [];
  DATA.forEach(grp=>{
    const tbl = computeTable(grp);
    tbl.forEach((t,i)=>{
      all.push({
        group:grp.g, pos:i, code:t.code, name:t.name,
        mp:t.mp, pts:t.pts, gd:t.gf-t.ga, gf:t.gf
      });
    });
  });
  // global sort: points, GD, GF (a true "all 48" ladder)
  all.sort((a,b)=> b.pts-a.pts || b.gd-a.gd || b.gf-a.gf || a.group.localeCompare(b.group) || a.pos-b.pos);

  // determine which third-place teams are in the qualifying 8 (for the badge)
  const alloc = thirdAllocation();
  const qualThirdGroups = new Set(alloc.qualifiers.map(q=>q.group));

  const rows = all.map((r,i)=>{
    const isThird = r.pos===2;
    const inTop8 = isThird && qualThirdGroups.has(r.group);
    const advancing = r.pos<2 || inTop8;
    let cls = '';
    if(isThird && inTop8) cls='q3';
    else if(isThird && !inTop8) cls='cut3';
    // position pill colored by group+pos
    const grpPill = `<span class="grp" style="background:var(--g${r.group}${r.pos});color:var(--t${r.group}${r.pos})">${r.group}${r.pos+1}</span>`;
    let tag='';
    if(r.pos<2) tag = `<span class="ptag" style="background:var(--g${r.group}0)">Q</span>`;
    else if(inTop8) tag = `<span class="ptag" style="background:var(--gold);color:#3a2c00">3rd → Q</span>`;
    else if(isThird) tag = `<span class="ptag" style="background:#aeb6ad">3rd · out</span>`;
    else tag = `<span class="ptag" style="background:#cfd4cd;color:#5a665f">4th</span>`;
    return `<tr class="${cls}">
      <td class="swatch" style="background:var(--g${r.group}${r.pos})"></td>
      <td class="cellnum pos">${i+1}</td>
      <td class="tname">${grpPill}${r.name}${tag}</td>
      <td class="cellnum">${r.pts}</td>
      <td class="cellnum ${r.gd>0?'gd-pos':r.gd<0?'gd-neg':''}">${r.gd>0?'+':''}${r.gd}</td>
      <td class="cellnum">${r.gf}</td>
    </tr>`;
  }).join('');

  return `
  <section class="block">
    <div class="secthead"><h2 class="bigtitle">Full ranking · all 48</h2></div>
    <p class="blurb">Every team across all twelve groups, ranked together by points, then goal difference, then goals scored. The pill shows group + finish (e.g. <b>D1</b> = Group D winner), colored on the same dark-to-light scale: 1st and 2nd are dark, 3rd is light, 4th is faintest. Gold rows are the third-place teams currently inside the top-8 cutoff.</p>
    <div class="ranktabs">
      <table class="ranktab">
        <thead><tr>
          <th></th><th>#</th><th class="tname">Team</th><th>PTS</th><th>GD</th><th>GF</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <p class="ranknote">Winners and runners-up (tag <b>Q</b>) are through. Among the twelve third-place teams, only the best eight advance — ranked by points, GD, goals scored, then FIFA's team-conduct and ranking tiebreakers, which aren't modeled here. Order is provisional while groups are still in progress.</p>
    </div>
  </section>`;
}
