// Entry point: render all sections from the shared DATA object.
import { renderUpcoming } from './upcoming.js';
import { renderGroups } from './groups.js';
import { renderFullRanking, renderMiniBracket } from './bracket.js';

function init(){
  // 0) "Around now" — yesterday / today / next two days
  document.getElementById('upcoming').innerHTML = renderUpcoming();
  // 1) Full 48-team ranking
  document.getElementById('topsection').innerHTML = renderFullRanking();
  // 2) The twelve group boxes (head-to-head matrix + standings)
  renderGroups();
  // 3) Live bracket below the groups
  document.getElementById('sections').innerHTML = renderMiniBracket();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
