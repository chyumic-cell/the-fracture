'use strict';
const assert=require('node:assert/strict');
const {createHash}=require('node:crypto');
const D=require('../src/data.js'),{Game,dist}=require('../src/simulation.js');
const sizes=[100,200,300,400,500,600,700],seeds=[42,48122,213301],counts=[],generation=[],saves=[];
let checks=0;
function test(name,fn){fn();checks++;console.log('PASS '+name);}
const game=(size,seed=42,players=2)=>new Game({size,seed,factions:['humans','machines','symbiotes','reptilians'].slice(0,players),teams:Array.from({length:players},(_,i)=>i)});
const digest=g=>createHash('sha256').update(JSON.stringify([g.map,g.starts,g.entities])).digest('hex');
function chart(g){for(const p of g.players){p.ai=false;p.explored.fill(1);p.knownNav.set(g.nav);g.map.forEach((t,i)=>p.knownTiles[i]=(t.water?128:0)|t.height);}}
function baseRoute(g,owner,targetOwner){
 const u=g.entities.find(e=>e.owner===owner&&e.kind==='unit'&&!g.blocked(e.x,e.y)),hq=g.entities.find(e=>e.owner===targetOwner&&e.kind==='building'&&g.def(e).kind==='hq');
 assert(u,'A starting worker must have a free departure cell');
 const candidates=[];
 for(let y=Math.floor(hq.y-hq.size-2);y<=Math.ceil(hq.y+hq.size+2);y++)for(let x=Math.floor(hq.x-hq.size-2);x<=Math.ceil(hq.x+hq.size+2);x++){
  const p={x:x+.5,y:y+.5},d=dist(p,hq);
  if(d>=hq.size+.5&&d<=hq.size+2&&!g.blocked(p.x,p.y))candidates.push(p);
 }
 candidates.sort((a,b)=>dist(u,a)-dist(u,b));
 let route=null,dest=null,best=Infinity;
 for(const p of candidates){const candidate=g.path(u,p),last=candidate.at(-1);if(last)best=Math.min(best,dist(last,p));if(last&&dist(last,p)<.1){route=candidate;dest=p;break;}}
 assert(route,'Disconnected base approach: size '+g.n+', seed '+g.options.seed+', '+owner+' -> '+targetOwner+', closest endpoint '+best.toFixed(2));
 let from={x:Math.floor(u.x)+.5,y:Math.floor(u.y)+.5};
 for(const step of route){assert(g.canTraverse(from.x,from.y,step.x,step.y),'Route crossed a real obstacle/cliff');assert(dist(from,step)<=Math.SQRT2+.001,'Route skipped a cell');from=step;}
 return {u,dest,route};
}
for(const size of sizes){
 test(size+': seeded generation is deterministic, with all four resource types',()=>{
  for(const seed of seeds){const start=performance.now(),a=game(size,seed);generation.push({size,seed,ms:performance.now()-start});const b=game(size,seed);assert.equal(a.n,size);assert.equal(a.map.length,size*size);assert.equal(digest(a),digest(b));const resources=a.entities.filter(e=>e.kind==='resource');counts.push({size,seed,resources:resources.length,trees:a.entities.filter(e=>e.kind==='tree').length});for(let r=0;r<4;r++)assert(resources.some(e=>e.resource===r),'Missing resource '+r);assert(a.entities.some(e=>e.kind==='tree'));}
  assert.notEqual(digest(game(size,seeds[0])),digest(game(size,seeds[1])));
 });
 test(size+': opposing bases connect with all generated trees, deposits and buildings retained',()=>{
  for(const seed of seeds){const g=game(size,seed),original=g.entities.length;chart(g);baseRoute(g,0,1);baseRoute(g,1,0);assert.equal(g.entities.length,original);}
  const g=game(size,seeds[0],4);chart(g);for(let owner=0;owner<4;owner++)baseRoute(g,owner,(owner+1)%4);
 });
 test(size+': a worker physically follows the generated route to the opposing base edge',()=>{
  const g=game(size);chart(g);const {u,dest}=baseRoute(g,0,1);
  for(let i=0;i<3000&&dist(u,dest)>.25;i++){const old={x:u.x,y:u.y};g.go(u,dest,.1,.15);assert(g.canTraverse(old.x,old.y,u.x,u.y),'Worker crossed an obstacle/cliff');}
  assert(dist(u,dest)<.25,'Worker failed to finish route: '+dist(u,dest).toFixed(2));
 });
}
const layouts=['natural','mountain-passes','steppes','labyrinth'];
test('The three named layouts generate distinct, deterministic terrain',()=>{
 const hashes=new Set();for(const layout of layouts){const options={size:96,seed:42,layout,factions:['humans','machines']},a=new Game(options),b=new Game(options);assert.equal(a.options.layout,layout);assert.equal(digest(a),digest(b),layout+' is not deterministic');hashes.add(createHash('sha256').update(JSON.stringify(a.map.map(t=>[t.water,t.height]))).digest('hex'));}
 assert.equal(hashes.size,layouts.length,'Layout selection must change actual terrain, not only its label');
});
for(const layout of layouts.slice(1))test(layout+': bases remain connected on every supported map size',()=>{
 for(const size of sizes){const start=performance.now(),g=new Game({size,seed:42,layout,factions:['humans','machines']});generation.push({size,seed:42,layout,ms:performance.now()-start});chart(g);baseRoute(g,0,1);baseRoute(g,1,0);const restored=Game.restore(g.serialize());assert.equal(restored.options.layout,layout);assert.deepEqual(restored.map,g.map);}
 const g=new Game({size:96,seed:42,layout,factions:['humans','machines','symbiotes','reptilians'],teams:[0,1,2,3]});chart(g);for(let owner=0;owner<4;owner++)baseRoute(g,owner,(owner+1)%4);
});
test('Resource availability scales with the enlarged map area',()=>{
 const means=sizes.map(size=>{const rows=counts.filter(r=>r.size===size);return rows.reduce((s,r)=>s+r.resources/(size*size),0)/rows.length;});
 // A gameplay density floor and cross-size tolerance, independent of the district implementation.
 for(let i=0;i<sizes.length;i++)assert(means[i]>=.004,'Too few deposits per map area at '+sizes[i]+': '+means[i]);
 assert(means.at(-1)>=means[0]*.7,'The largest maps lose over 30% of the small-map resource density');
});
for(const size of [...sizes,48,64,88])test(size+': save/load preserves map, economy and orders',()=>{
 const g=game(size);g.players.forEach(p=>p.ai=false);g.time=37.5;g.players[0].stock=[177,68,52,13];g.players[0].tech.push('humans_weapons1');
 const u=g.entities.find(e=>e.owner===0&&e.kind==='unit');g.order([u.id],{kind:'hold'});g.controlGroups={1:[u.id]};
 const encodeStart=performance.now(),saved=g.serialize(),encodeMs=performance.now()-encodeStart,decodeStart=performance.now(),h=Game.restore(saved);saves.push({size,version:JSON.parse(saved).version,bytes:Buffer.byteLength(saved),encodeMs,decodeMs:performance.now()-decodeStart});assert.equal(h.n,size);assert.equal(h.time,g.time);assert.deepEqual(h.options,g.options);assert.deepEqual(h.map,g.map);assert.deepEqual(h.starts,g.starts);assert.deepEqual(h.entities,g.entities);assert.deepEqual(h.controlGroups,g.controlGroups);assert.deepEqual(h.players[0].stock,g.players[0].stock);assert.deepEqual(h.players[0].tech,g.players[0].tech);assert.deepEqual(h.players[0].explored,g.players[0].explored);
 for(const p of h.players)for(const key of ['visible','explored','knownNav','knownTiles']){assert(p[key] instanceof Uint8Array);assert.equal(p[key].length,size*size);}
 h.tick(.1);assert.equal(h.time,37.6);
});
test('Legacy small saves without optional knowledge fields still load',()=>{
 const old=game(48),saved={version:1,options:old.options,time:old.time,nextId:old.nextId,entities:old.entities,players:old.players.map(({knownNav,knownTiles,knowledge,...p})=>({...p,visible:Array.from(p.visible),explored:Array.from(p.explored)})),map:old.map,starts:old.starts,rng:old.rng.s,winner:old.winner};
 const g=Game.restore(JSON.stringify(saved));assert.equal(g.n,48);assert.equal(g.players[0].knownNav.length,48*48);assert.equal(g.players[0].knownTiles.length,48*48);assert.deepEqual(g.controlGroups,{});
});
console.log('RESOURCE COUNTS '+JSON.stringify(counts));
console.log('GENERATION METRICS '+JSON.stringify(generation));
console.log('SAVE METRICS '+JSON.stringify(saves));
console.log('TOTAL '+checks+' large-map and legacy-save checks passed');

