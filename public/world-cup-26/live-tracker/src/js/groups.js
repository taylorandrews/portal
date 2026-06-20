import { DATA, AS_OF } from '../data/fixtures.js';
import { computeTable, gd } from './standings.js';

// helper: result of head-to-head cell = row team's goals vs col team
// returns {val, played} or null if same team
function h2h(group, rowCode, colCode){
  if(rowCode===colCode) return null;
  for(const m of group.matches){
    if(!m.score) continue;
    if(m.h===rowCode && m.a===colCode) return {gf:m.score[0], ga:m.score[1]};
    if(m.a===rowCode && m.h===colCode) return {gf:m.score[1], ga:m.score[0]};
  }
  return {pending:true};
}
function cellClass(cell){
  if(!cell || cell.pending) return '';
  if(cell.gf>cell.ga) return 'wcell';
  if(cell.gf<cell.ga) return 'lcell';
  return 'dcell';
}

export function renderGroups(){
  const grid = document.getElementById('grid');
  document.getElementById('asof').textContent = AS_OF;
  DATA.forEach(group=>{
  const table = computeTable(group);       // sorted by standing
  const order = table.map(t=>t.code);       // team codes in standing order
  const allPlayed = group.matches.every(m=>m.score);

  // --- triangular head-to-head matrix ---
  // top header: team codes
  let thead = '<tr><th class="cnr"></th>';
  order.forEach((c,i)=>{ thead += `<th class="topc" style="color:var(--t${group.g}${i});background:var(--g${group.g}${i})">${c}</th>`; });
  thead += '</tr>';

  let body = '';
  order.forEach((rc,ri)=>{
    body += `<tr><th class="rowc" style="color:var(--t${group.g}${ri});background:var(--g${group.g}${ri})">${rc}</th>`;
    order.forEach((cc,ci)=>{
      if(ri===ci){ body += '<td class="diag"></td>'; return; }
      const cell = h2h(group, rc, cc);
      if(cell && cell.pending){ body += '<td class="pend">·</td>'; return; }
      body += `<td class="${cellClass(cell)}">${cell.gf}</td>`;
    });
    body += '</tr>';
  });

  const matrix = `<table class="h2h"><thead>${thead}</thead><tbody>${body}</tbody></table>`;

  // --- standings rows ---
  const rows = table.map((tm,i)=>{
    const qual = i<2;
    const g = gd(tm);
    const sw = `<span class="cdot" style="background:var(--g${group.g}${i})"></span>`;
    return `<tr class="${qual && tm.mp>0 ? 'q':''}">
      <td class="pos">${i+1}</td>
      <td class="tname">${sw}${tm.name}${qual && allPlayed ? '<span class="qmark">✓</span>':''}</td>
      <td>${tm.mp}</td><td>${tm.w}</td><td>${tm.d}</td><td>${tm.l}</td>
      <td class="${(tm.gf-tm.ga)>0?'gd-pos':(tm.gf-tm.ga)<0?'gd-neg':''}">${g}</td>
      <td class="pts">${tm.pts}</td>
    </tr>`;
  }).join('');

  const tag = group.tag ? `<span class="gtag">★ ${group.tag}</span>`
            : group.kcNote ? `<span class="gtag">★ ${group.kcNote}</span>` : '';

  grid.insertAdjacentHTML('beforeend', `
    <div class="group">
      <div class="ghead">
        <div class="gbadge">${group.g}</div>
        <div class="gname">Group ${group.g}</div>
        ${tag}
      </div>
      <div class="gbody">
        <div class="gleft">${matrix}</div>
        <div class="gright">
          <table class="stand">
            <thead><tr>
              <th></th><th class="tname">Team</th>
              <th>P</th><th>W</th><th>D</th><th>L</th><th>GD</th><th>Pts</th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    </div>
  `);
});
}

