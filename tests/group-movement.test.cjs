'use strict';
// Group movement quality: groups pass a gap, detour around water, cross head-on and thread a cluttered
// base. Counts U-turns (a unit reversing its walking direction), units left with an unfinished order and
// arrival time. Thresholds sit just above the measured results after the November 2026 movement fixes;
// before them, the detour cost 27 U-turns and two head-on groups left two units stuck for the whole test.
const assert=require('node:assert/strict'),{Game}=require('../src/simulation.js');
function world(build){const g=new Game({size:64,seed:5,factions:['humans','machines']});g.entities=[];g.map.forEach(t=>{t.water=false;t.height=0;});g.players.forEach(p=>{p.ai=false;p.explored.fill(1);});g.spawnBuilding('humans_b0',0,6,6,true);g.spawnBuilding('machines_b0',1,58,58,true);build(g);g.rebuildNav();g.updateVision();return g;}
const water=(g,x0,x1,y0,y1)=>{for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)g.map[y*64+x].water=true;};
function run(build,groups){const g=world(build),all=[];for(const gr of groups){gr.us=[];for(let i=0;i<gr.n;i++)gr.us.push(g.spawnUnit('humans_u2',0,gr.from[0]+(i%4)*.9-1.35,gr.from[1]+Math.floor(i/4)*.9-1.35));all.push(...gr.us);}g.rebuildNav();
 for(const gr of groups)g.order(gr.us.map(u=>u.id),{kind:'move',x:gr.to[0]+.5,y:gr.to[1]+.5,formation:'line'});
 const track=new Map(all.map(u=>[u.id,{last:{x:u.x,y:u.y},dir:null}]));let uturns=0,arrived=null;
 for(let k=0;k<60*20;k++){g.tick(.05);if(k%10===9)for(const u of all){const t=track.get(u.id),dx=u.x-t.last.x,dy=u.y-t.last.y;if(Math.hypot(dx,dy)>.15){const d=Math.atan2(dy,dx);if(t.dir!==null){let a=Math.abs(d-t.dir)%(2*Math.PI);if(a>Math.PI)a=2*Math.PI-a;if(a>2.35)uturns++;}t.dir=d;}t.last={x:u.x,y:u.y};}
  if(arrived===null&&all.every(u=>!u.order&&!u.march))arrived=g.time;}
 return {uturns,arrived,stuck:all.filter(u=>u.order||u.march).length};}
const cases=[
 ['a group through a two-tile gap',g=>{water(g,30,31,2,61);for(let y=31;y<=32;y++)for(let x=30;x<=31;x++)g.map[y*64+x].water=false;},[{from:[21,32],to:[44,32],n:16}],18,30],
 ['a group detouring around water',g=>water(g,28,31,8,42),[{from:[20,26],to:[40,26],n:16}],14,50],
 ['two groups crossing head-on',()=>{},[{from:[16,30],to:[44,30],n:12},{from:[44,31],to:[16,31],n:12}],16,35],
 ['a group through a cluttered base',g=>{for(let x=0;x<4;x++)for(let y=0;y<4;y++)g.spawnBuilding('humans_b1',0,26+x*3.6,22+y*3.6,true);},[{from:[18,28],to:[46,30],n:16}],10,35],
];
for(const [name,build,groups,maxTurns,maxTime] of cases){const r=run(build,groups);
 assert.equal(r.stuck,0,name+': every unit finishes its order');assert(r.arrived!==null&&r.arrived<=maxTime,name+': arrives within '+maxTime+' s, took '+r.arrived);assert(r.uturns<=maxTurns,name+': at most '+maxTurns+' U-turns, got '+r.uturns);
 console.log('PASS '+name+': '+r.uturns+' U-turns, all arrived at '+r.arrived.toFixed(1)+' s');}
