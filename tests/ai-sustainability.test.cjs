'use strict';
const assert=require('node:assert/strict'),D=require('../src/data'),{Game}=require('../src/simulation'),A=require('../src/ai'),E=require('../src/ai-economy'),L=require('../src/ai-logistics'),C=require('../src/ai-combat');let checks=0;
function arena(f='humans'){const g=new Game({size:100,seed:42,factions:[f,'humans'],difficulty:'apocalypse'});g.entities=[];g.map.forEach(t=>{t.water=false;t.height=0;});g.players.forEach(p=>{p.ai=false;p.knowledge={};});const p=g.players[0];p.home={x:20,y:20};g.spawnBuilding(D.factions[f].buildings.find(b=>b.kind==='hq').id,0,20,20,true);g.spawnBuilding('humans_b0',1,90,90,true);for(let i=0;i<8;i++)g.spawnUnit(D.factions[f].units.find(u=>u.worker).id,0,24+i*.4,23);g.time=150;chart(g);return g;}
function chart(g){g.rebuildNav();g.updateVision();for(const p of g.players){p.explored.fill(1);p.visible.fill(1);p.knownNav.set(g.nav);p.knownTiles.set(g.map.map(t=>(t.water?128:0)|t.height));p.navigationRevision++;}for(const n of g.entities.filter(e=>e.kind==='resource'))g.players[0].knowledge[n.id]={...n};}
function node(g,r,x,y,amount){return g.add({kind:'resource',resource:r,x,y,hp:1,amount,maxAmount:amount,size:.85});}
for(const f of Object.values(D.factions)){
 const g=arena(f.id),p=g.players[0];for(let r=0;r<4;r++)node(g,r,28+r*3,24,300);chart(g);const plan=E.sustainability(g,p,A.context(g,p));
 assert(plan.ids.includes(f.id+'_deep_extraction'));assert(plan.ids.includes(f.id+'_advanced'));assert(plan.ids.includes(f.id+'_economy'));
 const expected=[0,0,0,0];for(const id of plan.ids)(D.buildings[id]||D.research[id]||D.units[id]).cost.forEach((v,i)=>expected[i]+=v);assert.deepEqual(plan.cost,expected);assert(plan.cost.every(v=>v>0));node(g,0,32,32,9000);chart(g);assert(E.sustainability(g,p,A.context(g,p)).ids.includes(f.id+'_deep_ore'),'discovery must not cancel a committed mine');p.stock=[...plan.cost];assert(!E.protectedSpend(p,D.units[f.id+'_siege_ship']));
 p.tech.push(f.id+'_economy');const next=E.sustainability(g,p,A.context(g,p));assert(!next.ids.includes(f.id+'_economy'));assert.equal(next.cost[0],plan.cost[0]-D.research[f.id+'_economy'].cost[0]);checks++;
}
console.log('PASS complete paid prerequisite budgets for all twelve civilizations');
{
 const g=arena(),p=g.players[0];for(let y=0;y<100;y++)for(let x=40;x<55;x++)g.tile(x,y).water=true;const homeOre=node(g,0,27,25,100),remote=node(g,0,60,25,1000);const landed=g.spawnUnit('humans_u0',0,59,25);g.spawnBuilding('humans_orewell',0,64,27,true);chart(g);p.stock=[100,0,0,0];E.step(g,p,A.context(g,p));assert.equal(landed.order?.target,remote.id,'landed worker gathers on the destination island');for(const w of g.entities.filter(u=>u.owner===0&&g.def(u)?.worker&&u.x<40))assert.notEqual(w.order?.target,remote.id,'home workers do not walk across water');
 landed.x=56;landed.y=25;const misleading=g.spawnBuilding('humans_orewell',0,39,25,true);g.spawnBuilding('humans_orewell',0,80,25,true);chart(g);assert.notEqual(g.collectionPoint(landed)?.id,misleading.id,'collection requires a real path');
 landed.aiLogistics=true;landed.order={kind:'board',target:987};E.step(g,p,A.context(g,p));assert.equal(landed.order.kind,'board','economic assignment preserves boarding');checks++;
}
{
 const g=arena(),p=g.players[0];p.stock=[10000,10000,10000,10000];g.time=240;const tower=g.spawnBuilding('humans_b7',0,28,28,true);chart(g);for(let i=0;i<10;i++){L.step(g,p,A.context(g,p));for(const b of g.entities.filter(e=>e.owner===0&&e.kind==='building'))b.progress=1;for(const w of g.entities.filter(e=>e.owner===0&&g.def(e)?.worker))w.order=null;g.time+=13;chart(g);}assert(g.entities.some(e=>e.owner===0&&g.def(e)?.kind==='trap'));assert(g.entities.some(e=>e.owner===0&&g.def(e)?.kind==='wall'));assert(g.path(g.entities.find(e=>g.def(e)?.worker),{x:35.5,y:35.5}).some(q=>q.x>32),'walls leave an exit');assert(p.stock[0]<10000,'defenses cost resources');checks++;
}
{
 const g=arena(),p=g.players[0],tower=g.spawnBuilding('humans_b7',0,30,30,true);g.spawnBuilding('humans_trap',0,34,30,true);for(let i=0;i<8;i++)g.spawnUnit('humans_u2',0,29+i*.2,32);const scout=D.factions.humans.units.find(u=>u.role==='scout');g.spawnUnit(scout.id,0,32,31);const enemy=g.spawnUnit('humans_u2',1,43,30);g.time=250;chart(g);C.ambush(g,p,A.context(g,p));assert(p.aiAmbush,'sets up a real bait maneuver');const bait=g.entity(p.aiAmbush.bait);g.time+=6;C.ambush(g,p,A.context(g,p));assert.equal(p.aiAmbush.phase,'withdraw');assert.equal(bait.order.kind,'move');enemy.x=35;chart(g);C.ambush(g,p,A.context(g,p));assert.equal(p.aiAmbush,null,'pursuer entering defense range releases counterattack');checks++;
}
console.log('PASS '+checks+' sustainability, reachable island work, paid defenses and ambush groups');
