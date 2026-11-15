'use strict';
const assert=require('node:assert/strict'),D=require('../src/data'),{Game}=require('../src/simulation'),A=require('../src/ai'),C=require('../src/ai-combat'),L=require('../src/ai-logistics');
function arena(level='apocalypse'){const g=new Game({size:64,seed:42,factions:['humans','humans'],difficulty:level});g.entities=[];g.map.forEach(t=>Object.assign(t,{water:false,height:0}));g.players.forEach(p=>{p.ai=false;p.knowledge={}});g.players[0].home={x:12,y:20};g.spawnBuilding('humans_b0',0,12,20,true);g.spawnBuilding('humans_b0',1,58,58,true);g.time=220;return g;}
function chart(g){g.rebuildNav();g.updateVision();for(const p of g.players){p.explored.fill(1);p.visible.fill(1);p.knownNav.set(g.nav);p.knownTiles.set(g.map.map(t=>(t.water?128:0)|t.height))}}
function unit(g,role,owner,x,y){return g.spawnUnit(D.factions.humans.units.find(u=>u.role===role&&!u.worker).id,owner,x,y)}
{
 const g=arena(),p=g.players[0];g.spawnBuilding('humans_b7',0,30,20,true);g.spawnBuilding('humans_orewell',0,31,23,true);const troops=Array.from({length:3},(_,i)=>unit(g,'rifle',0,27,19+i));for(let i=0;i<5;i++)unit(g,'rifle',1,39,20+i*.2);chart(g);C.step(g,p,A.context(g,p));assert(troops.some(u=>u.order?.kind==='attackMove'&&u.order.x<30),'defenders should draw a stronger attack into tower cover');console.log('PASS defenders use supporting tower fire instead of meeting a stronger force in the open');
}
{
 for(const level of ['relaxed','master']){const g=arena(level),p=g.players[0];for(let i=0;i<5;i++)unit(g,'rifle',0,30,25+i*.3);const target=g.spawnBuilding('humans_b2',1,40,25,false);chart(g);C.step(g,p,A.context(g,p));assert.equal(!!p.operation,level==='master');if(p.operation)assert.equal(p.operation.target.id,target.id);}console.log('PASS upper-tier assault timing exploits visible vulnerable construction without changing Relaxed');
}
{
 const g=arena(),p=g.players[0],u=unit(g,'rifle',0,30,30);for(let i=0;i<3;i++)unit(g,'rifle',0,29.7,29.7+i*.2);unit(g,'siege',1,34,30);u.cooldown=1.5;chart(g);C.step(g,p,A.context(g,p));assert.equal(u.order?.kind,'move');assert(u.aiMoveUntil>g.time);console.log('PASS ranged troops spread during cooldown before a visible artillery attack');
}
{
 const g=arena(),p=g.players[0],tower=D.factions.humans.buildings.find(b=>b.kind==='defense');p.stock=[1000,1000,1000,10];p.aiReserve=[0,0,0,0];p.aiLogistics={next:0,nextExpansion:1e6,nextSortie:1e6};for(const d of D.factions.humans.buildings.filter(b=>b.kind==='inf'||b.kind==='lab'))g.spawnBuilding(d.id,0,8,d.kind==='inf'?35:45,true);for(let i=0;i<5;i++)g.spawnUnit('humans_u0',0,16+i*.2,23);unit(g,'rifle',1,45,20);chart(g);const before=[...p.stock];L.step(g,p,A.context(g,p));const built=g.entities.find(b=>b.owner===0&&b.type===tower.id);assert(built,'a tower must not require spare Rift Crystals when it costs none');assert.equal(p.stock[3],before[3]-(tower.cost[3]||0));assert.equal(p.stock[0],before[0]-tower.cost[0]);console.log('PASS defensive construction pays its actual currencies without requiring unrelated resource reserves');
}

{
 const g=arena(),p=g.players[0],reloading=unit(g,'rifle',0,30,30),ready=unit(g,'rifle',0,30,31),weak=unit(g,'rifle',1,33,30),other=unit(g,'rifle',1,33,31);weak.hp=2;reloading.cooldown=.3;ready.cooldown=0;chart(g);C.step(g,p,A.context(g,p));assert.equal(ready.order.target,weak.id,'ready gun must receive the immediate kill');assert.equal(reloading.order.target,other.id,'reloading gun must not double-reserve the same kill');console.log('PASS ready weapons coordinate immediate kills before reloading allies');
}
{
 const g=arena(),p=g.players[0];p.stock=[10000,10000,10000,10000];p.aiReserve=[0,0,0,0];p.aiLogistics={next:0,nextExpansion:1e6,nextSortie:1e6,nextFortification:1e6};g.spawnBuilding('humans_b7',0,30,20,true);g.spawnUnit('humans_u0',0,28,23);unit(g,'rifle',1,45,20);for(let y=14;y<28;y++)for(let x=34;x<38;x++)g.tile(x,y).water=true;chart(g);L.step(g,p,A.context(g,p));const mine=g.entities.find(e=>e.owner===0&&g.def(e).kind==='trap');assert(mine,'build a paid mine on the reachable bend');assert(mine.x<34&&mine.y>23,'mine follows the southern approach instead of the blocked eastern bearing');assert(!g.tile(mine.x,mine.y).water);console.log('PASS mines follow discovered winding approaches around impassable terrain');
}
