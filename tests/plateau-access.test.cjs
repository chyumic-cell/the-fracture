'use strict';
const assert=require('node:assert/strict'),{apply}=require('../src/map-layouts.js');
for(const seed of [7,42,113])for(const layout of ['plains','steppes','mountain-passes','labyrinth','narrows'])for(const n of [100,200,300,400,500,600,700]){
 const starts=[{x:Math.round(n*.2),y:Math.round(n*.75)},{x:Math.round(n*.8),y:Math.round(n*.25)}],map=Array.from({length:n*n},()=>({height:0,water:false,road:false,texture:0})),r=apply({map,n,starts,layout,seed}),seen=new Uint8Array(n*n),queue=new Int32Array(n*n);let head=0,tail=0;
 const enqueue=i=>{if(!seen[i]&&!map[i].water){seen[i]=1;queue[tail++]=i;}};for(const s of starts)enqueue(s.y*n+s.x);
 // Disconnected islands can be approached by water transport. A shoreline is
 // an access seed, never a land edge across water.
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){const i=y*n+x;if(map[i].water||map[i].height>1)continue;if([x?i-1:-1,x<n-1?i+1:-1,y?i-n:-1,y<n-1?i+n:-1].some(j=>j>=0&&map[j].water))enqueue(i);}
 while(head<tail){const i=queue[head++],x=i%n,y=Math.floor(i/n);for(const j of [x?i-1:-1,x<n-1?i+1:-1,y?i-n:-1,y<n-1?i+n:-1])if(j>=0&&!seen[j]&&!map[j].water&&Math.abs(map[i].height-map[j].height)<2)enqueue(j);}
 for(const p of r.regions){const i=Math.floor(p.y)*n+Math.floor(p.x);if(!map[i].water)assert(seen[i],layout+' '+n+' inaccessible plateau '+p.x+','+p.y+' height '+map[i].height);}
 if(n===700)console.log('PASS plateau access, all seven sizes',layout,'seed',seed);
}
