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
console.log('TOTAL '+count+' map-layout topology checks passed');
