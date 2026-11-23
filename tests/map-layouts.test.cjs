'use strict';
const assert=require('node:assert/strict'),crypto=require('node:crypto'),{apply}=require('../src/map-layouts.js');
let count=0;const layouts=['mountain-passes','steppes','labyrinth'];
function test(name,fn){fn();count++;console.log('PASS '+name);}
function world(layout,n=144,players=2,seed=42){const starts=Array.from({length:players},(_,i)=>{const a=Math.PI*2*i/players+Math.PI*.72;return{x:Math.round(n/2+Math.cos(a)*n*.31),y:Math.round(n/2+Math.sin(a)*n*.31)};}),map=Array.from({length:n*n},(_,i)=>({water:false,height:0,texture:(i%37)/37,road:false})),info=apply({map,n,starts,seed,layout});return{layout,n,starts,map,info};}
function flood(w,start=w.starts[0],blocked){const {n,map}=w,steps=new Int32Array(n*n).fill(-1),queue=new Int32Array(n*n);let tail=1;queue[0]=Math.floor(start.y)*n+Math.floor(start.x);steps[queue[0]]=0;for(let head=0;head<tail;head++){const id=queue[head],x=id%n,y=Math.floor(id/n);for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=n||yy>=n)continue;const j=yy*n+xx;if(steps[j]>=0||blocked?.[j]||map[j].water||Math.abs(map[j].height-map[id].height)>1)continue;steps[j]=steps[id]+1;queue[tail++]=j;}}return{steps,area:tail};}
function signature(w){return crypto.createHash('sha256').update(Uint8Array.from(w.map,t=>t.height+(t.water?32:0)+(t.road?64:0))).digest('hex');}
function assertStarts(w,result){for(const start of w.starts){assert(result.steps[start.y*w.n+start.x]>=0,JSON.stringify({layout:w.layout,n:w.n,starts:w.starts}));for(let y=Math.floor(start.y-8);y<=Math.ceil(start.y+8);y++)for(let x=Math.floor(start.x-8);x<=Math.ceil(start.x+8);x++)if(Math.hypot(x+.5-start.x,y+.5-start.y)<8.5){const t=w.map[y*w.n+x];assert.equal(t.height,0,'Base building ground must be flat');assert.equal(t.water,false);}}}
function cliffs(w){let count=0,ramps=0;for(let y=0;y<w.n-1;y++)for(let x=0;x<w.n-1;x++){const h=w.map[y*w.n+x].height;for(const id of [y*w.n+x+1,(y+1)*w.n+x]){const d=Math.abs(w.map[id].height-h);if(d>1)count++;if(d===1)ramps++;}}return{count,ramps};}
function plateaus(w){const seen=new Uint8Array(w.map.length),sizes=[];for(let id=0;id<w.map.length;id++){if(seen[id])continue;const queue=[id],height=w.map[id].height;seen[id]=1;for(let head=0;head<queue.length;head++){const at=queue[head],x=at%w.n,y=Math.floor(at/w.n);for(const j of [x?at-1:-1,x<w.n-1?at+1:-1,y?at-w.n:-1,y<w.n-1?at+w.n:-1])if(j>=0&&!seen[j]&&w.map[j].height===height){seen[j]=1;queue.push(j);}}if(queue.length>=20)sizes.push(queue.length);}return sizes;}

test('Layouts are seed-deterministic, seed-sensitive and geometrically distinct',()=>{
 const hashes=[];for(const layout of layouts){const a=world(layout,96),b=world(layout,96),c=world(layout,96,2,87);assert.equal(signature(a),signature(b));assert.notEqual(signature(a),signature(c));hashes.push(signature(a));assert.deepEqual(a.info.protectedCells,b.info.protectedCells);assert(a.map.every((t,i)=>t.texture===(i%37)/37),'Terrain material variation was lost');assert(a.map.every(t=>Object.keys(t).sort().join(',')==='height,road,texture,water'),'Layouts added unsaved tile fields');}assert.equal(new Set(hashes).size,3);
});
test('Every base and every reserved movement lane remains connected at every supported size',()=>{
 let samples=0;for(const n of [96,144,192,500])for(const layout of layouts)for(const players of n===500?[2,4]:[2,3,4])for(const seed of n===500?[42,91]:[7,42,113]){
  const w=world(layout,n,players,seed),result=flood(w);assertStarts(w,result);for(let i=0;i<w.map.length;i++)if(w.info.protectedCells[i])assert(result.steps[i]>=0,'Unreachable protected lane: '+JSON.stringify({n,layout,players,seed,i}));samples++;
 }console.log('  '+samples+' terrain connectivity/base-clearance cases, including 500 by 500');
});
test('Protected passages survive dense incidental obstacles placed off the reserved lane',()=>{
 for(const layout of layouts){const w=world(layout),blocked=new Uint8Array(w.map.length);for(let y=1;y<w.n-1;y++)for(let x=1;x<w.n-1;x++){const i=y*w.n+x;if(w.info.protectedCells[i]||w.starts.some(s=>Math.hypot(s.x-x-.5,s.y-y-.5)<9))continue;if((x*17+y*31)%7===0)blocked[i]=1;}assertStarts(w,flood(w,w.starts[0],blocked));}
});
test('Opening deposits remain clear of lane reservations',()=>{
 for(const layout of layouts){const w=world(layout,96,4);for(const s of w.starts)for(const [dx,dy] of [[4,-4],[6,-3],[-6,-2],[1,7],[-5,6]])assert.equal(w.info.protectedCells[(s.y+dy)*w.n+s.x+dx],0);}
});
test('Mountain passes separate broad basins with narrow cuts through high cliffs',()=>{
 const w=world('mountain-passes'),reachable=flood(w),high=w.map.filter(t=>t.height>=3).length/w.map.length;assert(high>.15&&high<.55);assert(reachable.area/w.map.length>.4&&reachable.area/w.map.length<.85);assert(cliffs(w).count>w.n*3);
 let chokes=0;for(let y=3;y<w.n-3;y++)for(let x=3;x<w.n-3;x++){const i=y*w.n+x;if(w.map[i].height!==0)continue;const h=(dx,dy)=>w.map[(y+dy)*w.n+x+dx].height>=3;if(h(-3,0)&&h(3,0)||h(0,-3)&&h(0,3))chokes++;}assert(chokes>30,'Expected actual narrow ground passages between cliff faces');
});
test('Steppes retain many broad plateaus, several height levels and connected one-level ramps',()=>{
 for(const [n,players,seed] of [[96,4,7],[144,2,42],[192,3,113],[500,4,91]]){const w=world('steppes',n,players,seed),heights=new Set(w.map.map(t=>t.height)),edges=cliffs(w);assert(heights.has(0)&&heights.has(2)&&heights.has(4)&&heights.has(6));assert(w.info.ramps.length>=4);assert(edges.ramps>n&&edges.count>n);assert(plateaus(w).length>=6);assert(flood(w).area>w.map.length*.985,'A high plateau has no usable ramp');}
});
test('Labyrinth corridors contain physical dead ends and force a winding ground route',()=>{
 const w=world('labyrinth'),reachable=flood(w),ratio=reachable.area/w.map.length;assert(ratio>.25&&ratio<.6);const end=w.starts[1],route=reachable.steps[end.y*w.n+end.x],direct=Math.abs(end.x-w.starts[0].x)+Math.abs(end.y-w.starts[0].y);assert(route>direct*1.3,'The maze route should not collapse to a direct cross-map road');
 const spacing=w.info.regions[1].x-w.info.regions[0].x;let deadEnds=0;for(const node of w.info.regions){if(w.starts.some(s=>Math.hypot(s.x-node.x,s.y-node.y)<18))continue;let exits=0;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const x=Math.floor(node.x+dx*spacing/2),y=Math.floor(node.y+dy*spacing/2);if(x>=0&&y>=0&&x<w.n&&y<w.n&&w.map[y*w.n+x].height===0)exits++;}if(exits===1)deadEnds++;}assert(deadEnds>=5,'The terrain must contain genuine one-exit chambers');
});
// World map types: three or more per world, each connected, fair and recognisably themed.
const {worlds,forWorld,isMaritime}=require('../src/map-layouts.js'),worldIds=Object.values(worlds).flat().map(l=>l.id);
function within(w,start,limit){const r=flood(w,start);let area=0;for(let i=0;i<r.steps.length;i++)if(r.steps[i]>=0&&r.steps[i]<=limit)area++;return area;}
function adjacentCliff(w,high,low){let count=0;for(let y=0;y<w.n-1;y++)for(let x=0;x<w.n-1;x++){const i=y*w.n+x;for(const j of [i+1,i+w.n]){const a=w.map[i],b=w.map[j];if(a.water||b.water)continue;if(a.height>=high&&b.height<=low||b.height>=high&&a.height<=low)count++;}}return count;}
test('Every world offers at least three distinct, deterministic map types of its own',()=>{
 for(const theme of ['Kareth','Elyndra','Morvane']){const list=forWorld(theme);assert(list.length>=3,theme);assert(list.every(l=>l.id.startsWith(theme.toLowerCase()+'-')&&l.name&&l.hint),theme);}
 assert.equal(new Set(worldIds).size,worldIds.length);assert.deepEqual(forWorld('Unknown'),worlds.Kareth);
 const hashes=new Set();for(const id of worldIds){const a=world(id,96),b=world(id,96),c=world(id,96,2,87);assert.equal(a.info.layout,id);assert.equal(signature(a),signature(b),id+' is not seed-deterministic');assert.notEqual(signature(a),signature(c),id+' ignores the seed');assert.deepEqual(a.info.protectedCells,b.info.protectedCells);assert(a.map.every(t=>Object.keys(t).sort().join(',')==='height,road,texture,water'),id+' added unsaved tile fields');hashes.add(signature(a));}
 assert.equal(hashes.size,worldIds.length,'World map types must differ geometrically');
});
test('World map types connect every base and every reserved lane at every size',()=>{
 let samples=0;const cases=[];for(const n of [96,144,192])for(const players of [2,3,4])for(const seed of [7,42,113])cases.push([n,players,seed]);cases.push([500,2,42],[500,4,91],[700,4,42]);
 for(const id of worldIds)for(const [n,players,seed] of cases){const w=world(id,n,players,seed),result=flood(w);assertStarts(w,result);for(let i=0;i<w.map.length;i++)if(w.info.protectedCells[i])assert(result.steps[i]>=0,'Unreachable reserved lane: '+JSON.stringify({id,n,players,seed,i}));samples++;}
 console.log('  '+samples+' world-type connectivity/base-clearance cases, including 500 and 700');
});
test('World map types give every base comparable open ground and bounded overland detours',()=>{
 for(const id of worldIds)for(const n of [96,144,192])for(const players of [2,4])for(const seed of [7,42,113]){
  const w=world(id,n,players,seed),areas=w.starts.map(s=>within(w,s,18)),tag=JSON.stringify({id,n,players,seed});
  assert(Math.min(...areas)/Math.max(...areas)>=.75,'Unequal open ground near bases '+tag+' '+areas);
  for(const s of w.starts){const near=w.starts.filter(t=>t!==s).reduce((a,b)=>Math.hypot(a.x-s.x,a.y-s.y)<Math.hypot(b.x-s.x,b.y-s.y)?a:b),steps=flood(w,s).steps[near.y*n+near.x];assert(steps>0&&steps<=2.3*(Math.abs(near.x-s.x)+Math.abs(near.y-s.y)),'Nearest rival too far on foot '+tag);}
 }
});
test('Opening deposits remain clear of world-type lane reservations',()=>{
 for(const id of worldIds){const w=world(id,96,4);for(const s of w.starts)for(const [dx,dy] of [[4,-4],[6,-3],[-6,-2],[1,7],[-5,6]])assert.equal(w.info.protectedCells[(s.y+dy)*w.n+s.x+dx],0,id);}
});
test('World map types keep their themed terrain',()=>{
 const sample=id=>world(id,144,4,42),water=w=>w.map.filter(t=>t.water).length/w.map.length;
 {const w=sample('kareth-lochs');assert(water(w)>.03&&water(w)<.25);assert(!isMaritime('kareth-lochs'));let fords=0;for(let y=4;y<w.n-4;y++)for(let x=4;x<w.n-4;x++){const i=y*w.n+x,wet=(dx,dy)=>w.map[(y+dy)*w.n+x+dx].water;if(w.info.protectedCells[i]&&!w.map[i].water&&(wet(-3,0)&&wet(3,0)||wet(0,-3)&&wet(0,3)||wet(-2,-2)&&wet(2,2)||wet(-2,2)&&wet(2,-2)))fords++;}assert(fords>4,'Fords should cross the lochs');}
 {const w=sample('kareth-canyons'),mesa=w.map.filter(t=>t.height===3).length/w.map.length;assert(mesa>.25,'Canyonlands should be mostly mesa');assert(adjacentCliff(w,3,1)>w.n*3,'Mesas need cliff walls');const r=flood(w);let tops=0,climbed=0;for(let i=0;i<w.map.length;i++)if(w.map[i].height===3){tops++;if(r.steps[i]>=0)climbed++;}assert(climbed/tops>.5,'Mesa tops must be climbable');}
 {const w=sample('kareth-fjords');assert(isMaritime('kareth-fjords'));assert(water(w)>.08&&water(w)<.4);const edges=[[0,1],[w.n-1,1]].map(([c])=>[...Array(w.n).keys()].filter(k=>w.map[k*w.n+c].water).length).concat([0,w.n-1].map(r=>[...Array(w.n).keys()].filter(k=>w.map[r*w.n+k].water).length));assert(Math.max(...edges)>w.n*.6,'Fjords open onto a sea along one edge');}
 {const w=sample('elyndra-wildwood'),forest=w.info.forestCells;assert(forest,'Wildwood must mark forest');const land=w.map.filter(t=>!t.water).length,wooded=forest.reduce((a,b)=>a+b,0);assert(wooded/land>.4,'Wildwood should be mostly forest');for(let i=0;i<forest.length;i++)if(forest[i]){assert(!w.info.protectedCells[i],'Forest on a trail');assert(!w.starts.some(s=>Math.hypot(i%w.n+.5-s.x,Math.floor(i/w.n)+.5-s.y)<12),'Forest inside a base');}}
 {const w=sample('elyndra-terraces'),heights=new Set(w.map.map(t=>t.height));assert(heights.has(2)&&heights.has(4),'Terraces need stepped tiers');assert(w.info.ramps.length>=4);}
 {const w=sample('elyndra-lakes');assert(water(w)>.04);assert(adjacentCliff(w,2,0)>w.n,'Crater lakes need raised rims');}
 {const w=sample('morvane-rifts');assert(water(w)>.03);const blocked=Uint8Array.from(w.info.protectedCells);assert(flood(w,w.starts[0],blocked).area<flood(w).area*.85,'Rifts should be crossed only at bridges');}
 {const w=sample('morvane-craters'),r=flood(w);let floors=0,reached=0;for(let i=0;i<w.map.length;i++)if(w.map[i].height===1){floors++;if(r.steps[i]>=0)reached++;}assert(adjacentCliff(w,3,1)>w.n*2,'Craters need walls');assert(reached/floors>.8,'Crater floors need breaches');}
 {const w=sample('morvane-spires'),spires=w.map.filter(t=>t.height>=6).length;assert(spires>w.n,'Spire Wastes need stone spires');assert(flood(w).area<w.map.length*.99);}
});
console.log('TOTAL '+count+' map-layout topology checks passed');
