"use strict";
const assert=require('node:assert/strict'),D=require('../src/data'),A=require('../src/ai'),E=require('../src/ai-economy'),L=require('../src/ai-logistics'),{Game}=require('../src/simulation');
function arena(f='humans',difficulty='easy'){
 const g=new Game({size:64,seed:42,factions:[f,f],difficulty});g.entities=[];g.map.forEach(t=>{t.water=false;t.height=0;});g.players.forEach(p=>{p.ai=false;p.knowledge={};});
 const p=g.players[0];p.home={x:12,y:12};p.stock=[2500,1000,1000,0];g.spawnBuilding(f+'_b0',0,12,12,true);g.spawnBuilding(f+'_b0',1,56,56,true);
 for(let i=0;i<8;i++)g.spawnUnit(D.factions[f].units.find(u=>u.worker).id,0,17+i*.3,15);
 g.time=150;chart(g);return g;
}
function chart(g){g.rebuildNav();g.updateVision();for(const p of g.players){p.explored.fill(1);p.knownNav.set(g.nav);p.knownTiles.set(g.map.map(t=>(t.water?128:0)|t.height));p.navigationRevision++;}g.pathCache?.clear();}
for(const f of Object.keys(D.factions)){
 const g=arena(f),p=g.players[0];p.aiRenewableTargets=[0];const c=A.context(g,p),plan=E.sustainability(g,p,c);
 assert(plan.tradeRecovery,f+' must fund a paid fallback for missing crystals');
 const cost=[0,0,0,0];for(const id of plan.ids)(D.buildings[id]||D.research[id]||D.units[id]).cost.forEach((v,i)=>cost[i]+=v);
 D.buildings[f+'_market'].cost.forEach((v,i)=>cost[i]+=v);assert.deepEqual(plan.cost,cost,'Two markets must both be reserved');
 g.spawnBuilding(f+'_market',0,20,24,true);g.spawnBuilding(f+'_market',0,36,24,true);const m=g.spawnUnit(f+'_merchant',0,23,24);chart(g);
 p.stock=[0,1000,1000,0];p.tradeCredits=0;m.order={kind:'move',x:63,y:63};const before=[...p.stock];L.step(g,p,A.context(g,p));
 assert.equal(m.order?.kind,'trade',f+' rally order must become trade even with no ore');assert.deepEqual(p.stock,before,'Routing gives no free resources');
 for(let i=0;i<1200;i++)g.tick(.1);
 assert(m.tradeEarned>0,f+' merchant must physically complete paid trips');assert(p.tradeCredits>0);
 const credits=p.tradeCredits,ore=p.stock[0];assert(g.exchange(0,0).ok);assert.equal(p.stock[0],ore+10);assert.equal(p.tradeCredits,credits-20);
}
console.log('PASS all twelve civilizations fund two markets, recover rally-blocked merchants and earn ordinary trade income');
{
 const g=arena(),p=g.players[0],w=g.entities.find(e=>e.owner===0&&g.def(e)?.worker);g.order([w.id],{kind:'move',x:40,y:40});
 E.recover(g,p,A.context(g,p));p.aiState.economy={routes:{old:1},failedSites:{old:999},workers:{[w.id]:{node:999}},goal:'old'};p.aiSupplyRoutes={old:1};
 const stock=[...p.stock];g.time+=80;E.recover(g,p,A.context(g,p));assert(p.aiState.recovery.stalled);assert.equal(w.order,null);assert.deepEqual(p.aiSupplyRoutes,{});assert.deepEqual(p.aiState.economy.failedSites,{});assert.deepEqual(p.stock,stock);
 const restored=Game.restore(g.serialize());assert.equal(restored.players[0].aiState.recovery.stalled,true);
 p.gathered[0]+=10;g.time+=11;E.recover(g,p,A.context(g,p));assert(!p.aiState.recovery.stalled,'Real income clears the recovery state');
}
console.log('PASS stalled work is retried without granting resources, and recovery survives saves');
{
 const g=arena(),p=g.players[0],w=g.entities.find(e=>e.owner===0&&g.def(e)?.worker);w.aiLogistics=true;w.order={kind:'board',target:999};E.recover(g,p,A.context(g,p));g.time+=90;E.recover(g,p,A.context(g,p));assert.equal(w.order.kind,'board','Do not interrupt an active transport assignment');
 w.aiLogistics=false;w.x+=2;w.order={kind:'move',x:40,y:40};g.time+=11;E.recover(g,p,A.context(g,p));assert.equal(w.order.kind,'move','Moving work must not be cancelled');
}
{
 const g=arena('humans','relaxed'),p=g.players[0];E.recover(g,p,A.context(g,p));assert.equal(p.aiState.recovery.stalled,false);p.aiRenewableTargets=[0];assert(!E.sustainability(g,p,A.context(g,p)).tradeRecovery);g.time+=90;E.recover(g,p,A.context(g,p));assert(E.sustainability(g,p,A.context(g,p)).tradeRecovery,'A stalled baseline still needs a legal recovery route');
}
console.log('PASS active voyages and Relaxed tuning are preserved; stalled low tiers can recover');
{
 const g=arena(),p=g.players[0],w=g.entities.find(e=>e.owner===0&&g.def(e)?.worker);w.x=10.5;w.y=32.5;
 // A fully charted five-cell corridor. Foundations cannot seal the only exit.
 p.knownNav.fill(1);for(let y=30;y<=34;y++)for(let x=5;x<59;x++)p.knownNav[y*g.n+x]=0;g.pathCache?.clear();
 g.pathCache=new Map();const q={x:54.5,y:32.5},nav=p.knownNav,cache=g.pathCache,copy=nav.slice();
 assert(!E.keepsRoutes(g,p,{size:3.5},{x:30.5,y:32.5},w,[q]));assert.equal(p.knownNav,nav);assert.equal(g.pathCache,cache);assert.deepEqual(nav,copy);
 assert(E.keepsRoutes(g,p,{size:1},{x:30.5,y:32.5},w,[q]),'Keep a usable route around smaller foundations');
}
console.log('PASS foundations preserve narrow corridor exits and restore private navigation state');

{
 const g=arena('machines','apocalypse'),p=g.players[0];
 for(let y=0;y<64;y++)for(let x=40;x<64;x++)g.tile(x,y).water=true;
 g.spawnBuilding('machines_dock',0,39,24,true);g.spawnBuilding('machines_b3',0,12,24,true);g.spawnBuilding('machines_b4',0,25,12,true);
 p.stock=[2500,1000,1000,100];p.tech=['machines_economy','machines_advanced'];p.aiRenewableTargets=[0];
 while(g.population(0)<g.capacity(0))g.spawnUnit('machines_u0',0,16,17);
 p.aiLogistics={transportWanted:'machines_transport_ship'};chart(g);
 E.step(g,p,A.context(g,p));
 assert(g.entities.some(e=>e.owner===0&&e.queue?.some(q=>q.type==='machines_deep_extraction')),'Population-blocked transport must not prevent paid drilling research');
 assert.notEqual(p.aiState.economy.goal,'transport:machines_transport_ship');
}
console.log('PASS a population-blocked transport cannot deadlock housing and drilling');

{
 const g=arena(),p=g.players[0];g.spawnBuilding('humans_market',0,24,24,true);g.spawnUnit('humans_u2',1,16,12);p.stock=[0,0,0,0];p.tradeCredits=40;chart(g);
 L.step(g,p,A.context(g,p));assert.equal(p.tradeCredits,20);assert.deepEqual(p.stock,[10,0,0,0],'Home defense must not prevent spending already earned credits');
}
console.log('PASS attacked bases can spend earned trade credits at normal exchange rates');

for(const difficulty of ['gentle','relaxed','easy']){
 const g=arena('humans',difficulty),p=g.players[0];let kept=false;g.entities=g.entities.filter(e=>{if(e.owner!==0||!g.def(e)?.worker)return true;if(kept)return false;kept=true;return true;});p.aiRenewableTargets=[0];
 E.recover(g,p,A.context(g,p));g.time+=90;E.recover(g,p,A.context(g,p));const plan=E.sustainability(g,p,A.context(g,p));
 assert(plan.tradeRecovery,difficulty+' can fund recovery with one surviving worker');assert(plan.ids.includes('humans_market'));assert(plan.ids.includes('humans_merchant'));
}
console.log('PASS one surviving worker can still receive a funded trading recovery plan on low difficulties');
