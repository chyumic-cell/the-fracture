'use strict';
// The region labels, the stuck-path memo and the known-only skip in path() are shortcuts only:
// every answer must match the full A* search they replace. Checks ground units on partially
// explored maps with water, cliffs, rock and forest, before and after more exploration.
const assert=require('node:assert/strict'),{Game}=require('../src/simulation.js');
let cases=0,relaxed=0;
function rng(seed){return()=>((seed=Math.imul(seed^seed>>>15,2246822519)+1013904223>>>0)/4294967296);}
function reference(g,u,dest){const saved={knownNear:g.knownNear,stuck:g.stuckPaths};g.knownNear=()=>true;g.stuckPaths=new Map();g.pathCache=new Map();g.exhaustivePaths=true;try{return g.path(u,dest);}finally{g.exhaustivePaths=false;g.knownNear=saved.knownNear;g.stuckPaths=saved.stuck;g.pathCache=new Map();}}
function oldKnownRoute(g,u,q){g.pathCache=new Map();const save=g.knownNear;g.knownNear=()=>true;g.exhaustivePaths=true;try{const route=g.path(u,q),p=g.players[u.owner];return Math.hypot((route.at(-1)||u).x-q.x,(route.at(-1)||u).y-q.y)<2&&route.every(v=>p.explored[Math.floor(v.y)*g.n+Math.floor(v.x)]);}finally{g.exhaustivePaths=false;g.knownNear=save;g.pathCache=new Map();}}
for(const [layout,seed] of [['narrows',48122],['natural',42],['labyrinth',213301],['mountains',7]]){
 const g=new Game({factions:['humans','insects'],size:96,seed,layout});g.players.forEach(p=>p.ai=false);const r=rng(seed),n=g.n,u=g.entities.find(e=>e.kind==='unit'&&e.owner===0&&g.def(e).worker);
 for(let round=0;round<3;round++){
  // Reveal a few random patches each round so the known and optimistic maps both change.
  for(let k=0;k<6;k++){const cx=Math.floor(r()*n),cy=Math.floor(r()*n);for(let y=Math.max(0,cy-9);y<Math.min(n,cy+9);y++)for(let x=Math.max(0,cx-9);x<Math.min(n,cx+9);x++){const i=y*n+x,t=g.map[i],p=g.players[0];p.explored[i]=1;const code=(t.water?128:0)|t.height;if(p.knownNav[i]!==g.nav[i]||p.knownTiles[i]!==code)p.navigationRevision=(p.navigationRevision||0)+1;p.knownNav[i]=g.nav[i];p.knownTiles[i]=code;}}
  g.forgetExploredCount(g.players[0]);g.time+=1;
  for(let k=0;k<70;k++){
   const start={x:Math.floor(r()*n)+.5,y:Math.floor(r()*n)+.5};if(g.blocked(start.x,start.y,false,0))continue;u.x=start.x;u.y=start.y;
   const dest={x:Math.floor(r()*n)+.5,y:Math.floor(r()*n)+.5};
   const fast=g.path(u,dest),again=g.path(u,dest),full=reference(g,u,dest);
   assert.deepEqual(fast,full,`${layout} path differs from full search ${JSON.stringify(start)} -> ${JSON.stringify(dest)}`);assert.deepEqual(again,full,`${layout} memoised path differs`);
   const open=g.navRegions(0,true),from=g.regionsFrom(open,u.x,u.y),label=open.labels[Math.floor(dest.y)*n+Math.floor(dest.x)],end=full.at(-1)||u,reached=Math.floor(end.x)===Math.floor(dest.x)&&Math.floor(end.y)===Math.floor(dest.y);
   if(!label||!from.has(label))assert(!reached||Math.floor(u.x)===Math.floor(dest.x)&&Math.floor(u.y)===Math.floor(dest.y),`${layout} region map rejected a reachable goal`);
   if(!g.blocked(dest.x,dest.y,false,0)){const fast=g.knownRoute(u,dest),old=oldKnownRoute(g,u,dest);if(fast!==old){g.pathCache=new Map();g.exhaustivePaths=true;const known=g.path(u,dest,true);g.exhaustivePaths=false;g.pathCache=new Map();assert(fast&&known.length&&Math.hypot(known.at(-1).x-dest.x,known.at(-1).y-dest.y)<2,`${layout} knownRoute disagrees with the full search without a known route to back it`);relaxed++;}}
   cases++;
  }
 }
}
assert(cases>600,'Too few sampled routes: '+cases);
// A unit sealed in by known obstacles gets an empty route, which is memoised; once it sees one
// obstacle cleared (knownNav 1 -> 0 through the real vision pass), the memo must not hide the exit.
{const g=new Game({size:48,seed:5,factions:['humans','humans']});g.entities=[];g.map.forEach(t=>{t.height=0;t.water=false;});g.nav.fill(0);g.players.forEach(p=>{p.ai=false;p.explored.fill(1);p.knownNav.fill(0);p.knownTiles.fill(0);});
 const u=g.spawnUnit('humans_u0',0,20.5,20.5),ring=[];for(let y=19;y<=21;y++)for(let x=19;x<=21;x++)if(x!==20||y!==20)ring.push(y*g.n+x);for(const i of ring){g.nav[i]=1;g.players[0].knownNav[i]=1;}
 const dest={x:40.5,y:20.5};assert.deepEqual(g.path(u,dest),[],'Sealed unit should have no route');assert.deepEqual(g.path(u,dest),[],'Memoised sealed route');
 g.nav[20*g.n+21]=0;g.updateVision();assert.equal(g.players[0].knownNav[20*g.n+21],0);const route=g.path(u,dest);assert(route.length>0&&Math.floor(route.at(-1).x)===40,'Cleared exit must invalidate the stuck-route memo');cases++;}
// The explored-only map absorbs newly explored cells instead of re-flooding the map. While units
// explore through the ordinary vision pass, it must split the map exactly as a fresh build does.
let absorbed=0;
for(const [layout,seed] of [['mountains',7],['labyrinth',213301],['narrows',48122]]){
 const g=new Game({factions:['humans','insects'],size:96,seed,layout});g.players.forEach(p=>p.ai=false);const n=g.n,r=rng(seed+1),units=g.entities.filter(e=>e.kind==='unit'&&e.owner===0);
 g.updateVision();g.navRegions(0,false);
 for(let step=0;step<40;step++){
  for(const u of units)if(!u.order||step%8===0)g.order([u.id],{kind:'move',x:Math.floor(r()*n)+.5,y:Math.floor(r()*n)+.5});
  for(let k=0;k<20;k++)g.tick(.05);
  const inc=g.navRegions(0,false),fresh=(()=>{const keep=g.regionCache;g.regionCache=new Map();try{return g.navRegions(0,false);}finally{g.regionCache=keep;}})();
  if(inc!==fresh&&inc.pending)absorbed++;
  const ab=new Map(),ba=new Map();for(let i=0;i<n*n;i++){const x=inc.label(i),y=fresh.label(i);assert.equal(!!x,!!y,layout+' walkable cell differs at '+i);if(!x)continue;if(ab.has(x))assert.equal(ab.get(x),y,layout+' incremental map joins regions a fresh build keeps apart');else ab.set(x,y);if(ba.has(y))assert.equal(ba.get(y),x,layout+' incremental map splits a region');else ba.set(y,x);}
 }
}
assert(absorbed>20,'the explored-only map should usually be updated in place, got '+absorbed);
console.log('PASS navigation regions match full A* for '+cases+' sampled routes across four layouts and three exploration rounds; incremental region map matched fresh builds over '+absorbed+' updates; '+relaxed+' knownRoute answers were yes where the old search detoured through unexplored ground');
