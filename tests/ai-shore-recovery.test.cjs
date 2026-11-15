'use strict';
const assert=require('node:assert/strict'),{Game}=require('../src/simulation'),A=require('../src/ai'),L=require('../src/ai-logistics');
function fixture(){const g=new Game({size:64,seed:1,factions:['humans','humans'],difficulty:'apocalypse'});g.entities=[];g.map.forEach(t=>Object.assign(t,{height:0,water:false}));g.players.forEach(p=>{p.ai=false;p.knowledge={};p.stock=[0,0,0,0]});return g;}
function reveal(g){g.rebuildNav();g.updateVision();for(const p of g.players){p.explored.fill(1);p.visible.fill(1);p.knownNav.set(g.nav);p.knownTiles.set(g.map.map(t=>(t.water?128:0)|t.height));}}
{
 const g=fixture(),u=g.spawnUnit('humans_u0',0,18.5,20.5),n=g.add({kind:'resource',resource:0,x:22,y:20,hp:1,amount:100,size:.85});reveal(g);
 // Seal off the closest working cell, leaving the far edge reachable via a detour.
 const p=g.players[0],closest=g.gatherSpot(u,n);assert(closest);const cx=Math.floor(closest.x),cy=Math.floor(closest.y);for(const [dx,dy]of [[-1,0],[1,0],[0,-1],[0,1]])p.knownNav[(cy+dy)*g.n+cx+dx]=1;g.pathCache?.clear();
 const alternate=g.gatherSpot(u,n);assert(alternate);assert.notDeepEqual(alternate,closest);assert(g.path(u,alternate).length,'working edge must have an actual route');
 console.log('PASS gathering rejects a sealed nearest working edge and uses a reachable alternative');
}
{
 const g=fixture();for(let y=0;y<64;y++)for(let x=30;x<64;x++)g.tile(x,y).water=true;
 const u=g.spawnUnit('humans_u0',0,27.5,28.5),t=g.spawnUnit('humans_transport_ship',0,31.5,30.5);reveal(g);const p=g.players[0],nearest=g.approach(u,t,1);p.knownNav[Math.floor(nearest.y)*g.n+Math.floor(nearest.x)]=1;g.pathCache?.clear();g.board([u.id],t.id,0);
 for(let i=0;i<200&&!u.embarkedBy;i++){g.tickUnit(u,.1);g.time+=.1;}
 assert.equal(u.embarkedBy,t.id,'worker must board using the open shoreline cell');console.log('PASS boarding uses an accessible shoreline instead of a blocked nearest approach');
}
{
 const g=fixture();for(let y=0;y<64;y++)for(let x=30;x<64;x++)g.tile(x,y).water=true;const p=g.players[0];p.home={x:15,y:30};g.spawnBuilding('humans_b0',0,15,30,true);g.spawnBuilding('humans_dock',0,29,30,true);const t=g.spawnUnit('humans_transport_ship',0,32,30),u=g.spawnUnit('humans_u0',0,32,30);u.embarkedBy=t.id;u.carry=0;p.aiLogistics={next:0,nextExpansion:1e6,nextSortie:1e6};g.spawnBuilding('humans_b0',1,10,55,true);reveal(g);
 for(let i=0;i<2500&&u.embarkedBy;i++){if(i%10===0)L.step(g,p,A.context(g,p));g.tick(.1);}
 assert(!u.embarkedBy,'empty-handed orphan passengers must also return to land');assert.equal(p.stock[0],0);assert.equal(p.gathered[0],0);console.log('PASS orphaned empty-handed workers disembark without free income');
}
