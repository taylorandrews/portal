import { DATA } from '../data/fixtures.js';

export function computeTable(group){
  const t = {};
  Object.keys(group.teams).forEach(code=>{
    t[code] = {code, name:group.teams[code], mp:0,w:0,d:0,l:0,gf:0,ga:0,pts:0};
  });
  group.matches.forEach(m=>{
    if(!m.score) return;
    const [hg,ag]=m.score, H=t[m.h], A=t[m.a];
    H.mp++;A.mp++;H.gf+=hg;H.ga+=ag;A.gf+=ag;A.ga+=hg;
    if(hg>ag){H.w++;A.l++;H.pts+=3;}
    else if(hg<ag){A.w++;H.l++;A.pts+=3;}
    else{H.d++;A.d++;H.pts++;A.pts++;}
  });
  return Object.values(t).sort((a,b)=>
    b.pts-a.pts || (b.gf-b.ga)-(a.gf-a.ga) || b.gf-a.gf || a.name.localeCompare(b.name)
  );
}

export function gd(team){const g=team.gf-team.ga; return (g>0?"+":"")+g;}
