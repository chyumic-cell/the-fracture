"use strict";
const assert=require('node:assert/strict'),{Game}=require('../src/simulation'),D=require('../src/data'),A=require('../src/ai'),E=require('../src/ai-economy'),C=require('../src/ai-combat');
function arena(difficulty){const g=new Game({size:64,seed:17,factions:['humans','humans'],difficulty});g.entities=[];g.map.forEach(t=>Object.assign(t,{water:false,height:0}));g.players.forEach(p=>{p.ai=false;p.stock=[0,0,0,0];p.knowledge={};});const p=g.players[0];p.home={x:12,y:12};g.spawnBuilding('humans_b0',0,12,12,true);g.spawnBuilding('humans_b0',1,54,54,true);g.time=160;return g;}
function chart(g){g.rebuildNav();g.updateVision();for(const p of g.players){p.explored.fill(1);p.knownNav.set(g.nav);p.knownTiles.set(g.map.map(t=>t.height));}}
for(const profile of A.levels.slice(2)){
 const g=arena(profile.id),p=g.players[0],unit=g.spawnUnit('humans_u2',0,24,24),enemy=g.spawnUnit('humans_u2',1,28,24);unit.hp=unit.maxHp*.2;chart(g);
 for(let i=0;i<4;i++){C.step(g,p,A.context(g,p));assert(!(unit.aiWithdrawUntil>g.time),profile.id+' repeatedly seeks nonexistent healing');assert.equal(unit.order?.kind,'attack');assert.equal(unit.order.target,enemy.id);g.time+=13;}
}
console.log('PASS all eight tiers above Relaxed retain wounded combatants when healing is unavailable');
{
 const g=arena('expert'),p=g.players[0],unit=g.spawnUnit('humans_u2',0,24,24);unit.hp=unit.maxHp*.2;const healer=Object.values(D.units).find(u=>u.faction==='humans'&&u.heal)||D.factions.humans.units.find(u=>u.heal);assert(healer);g.spawnUnit(healer.id,0,18,24);g.spawnUnit('humans_u2',1,28,24);chart(g);C.step(g,p,A.context(g,p));assert(unit.aiWithdrawUntil>g.time);assert.equal(unit.order.kind,'move');
}
console.log('PASS wounded soldiers still withdraw to actual healing support');
for(const profile of A.levels.slice(2)){
 const g=arena(profile.id),p=g.players[0],w=g.spawnUnit('humans_u0',0,22,12);w.carry=12;w.carryType=0;w.order={kind:'move',x:42,y:12};chart(g);const start=p.stock[0];E.step(g,p,A.context(g,p));assert.equal(w.order?.kind,'returnCargo',profile.id+' failed to bank cargo');
 for(let i=0;i<240&&w.carry;i++){if(i%10===0)E.step(g,p,A.context(g,p));g.tick(.1);}
 assert.equal(w.carry,0);assert.equal(p.gathered[0],12);assert.equal(p.stock[0],start+12,'cargo must be deposited exactly once through normal movement');
}
console.log('PASS all eight stronger tiers physically deliver cargo without reassignment or extra resources');
{
 const g=arena('master'),p=g.players[0];chart(g);const plan=E.sustainability(g,p,A.context(g,p));plan.cost=[180,80,60,30];p.stock=[240,0,0,0];
 assert(E.protectedSpend(p,{id:'test-infantry',cost:[60,0,0,0]}),'Ore purchase must not require nonexistent Rift expenditure');
 assert(!E.protectedSpend(p,{id:'test-infantry',cost:[61,0,0,0]}),'actual Ore reserve must stay protected');
 assert(!E.protectedSpend(p,{id:'test-aircraft',cost:[60,1,0,0]}),'cannot spend missing Oil');
}
console.log('PASS currency-specific spending preserves actual commitments without unrelated resource deadlocks');

{
 const g=arena('standard'),p=g.players[0];p.tech=['humans_economy','humans_advanced','humans_deep_extraction'];p.stock=[245,1000,1000,1000];p.aiRenewableTargets=[0];
 for(let i=0;i<9;i++)g.spawnUnit('humans_u0',0,18+i*.2,14);g.spawnBuilding('humans_b2',0,12,25,true);g.spawnBuilding('humans_b3',0,22,25,true);
 const n=g.add({kind:'resource',resource:0,x:43,y:12,hp:1,amount:4000,maxAmount:4000,size:.85}),depleted=g.add({kind:'resource',resource:0,x:18,y:12,hp:1,amount:0,maxAmount:900,size:.85});chart(g);p.knowledge[n.id]={...n};p.knowledge[depleted.id]={...depleted};
 const plan=E.sustainability(g,p,A.context(g,p));assert.equal(plan.liquidRemaining[0],0,'remote Ore is not a current delivery stream');assert(plan.remaining[0]>=4000);assert(plan.ids.includes('humans_orewell'),'fund the missing physical collection point');
 for(let i=0;i<400&&!g.entities.some(e=>e.type==='humans_orewell');i++){if(i%10===0)E.step(g,p,A.context(g,p));g.tick(.1);}assert(g.entities.some(e=>e.type==='humans_orewell'&&e.progress<1),'expand collection before buying extra troops');assert.equal(p.stock[0]+(g.entities.some(e=>e.owner===0&&e.type==='humans_deep_ore')?180:0),180,'keep the mine capital or spend it on the actual mine');
 const hostile=g.spawnBuilding('humans_b2',1,44,16,true);chart(g);p.knowledge[hostile.id]={...hostile};g.visible=()=>false;const threatened=E.sustainability(g,p,A.context(g,p));assert.equal(threatened.remaining[0],0,'remembered enemy bases are not safe economic expansion sites');
}
console.log('PASS stronger economies fund real collection routes, preserve mine capital and avoid known hostile bases');

{
 const g=arena('challenging'),p=g.players[0];p.stock=[1000,1000,1000,1000];p.tech=['humans_economy','humans_advanced','humans_deep_extraction'];p.aiRenewableTargets=[0];
 for(let i=0;i<6;i++)g.spawnUnit('humans_u0',0,22+i*.3,12);const n=g.add({kind:'resource',resource:0,x:26,y:12,hp:1,amount:0,maxAmount:900,size:.85});
 // A narrow traversable ledge has no footprint wide enough for a mine.
 for(let y=10;y<=14;y++)for(let x=25;x<=28;x++)g.tile(x,y).height=y===12?0:4;
 chart(g);p.knowledge[n.id]={...n};let plan=E.sustainability(g,p,A.context(g,p));assert(plan.tradeRecovery);assert(!plan.ids.includes('humans_deep_ore'));assert(plan.ids.includes('humans_market'));assert(plan.ids.includes('humans_merchant'));
 const remembered=JSON.stringify(plan);p.visible.fill(0);g.map.forEach(t=>t.height=0);plan=E.sustainability(g,p,A.context(g,p));assert.equal(JSON.stringify(plan),remembered,'hidden terrain changes must not alter the decision');
 chart(g);plan=E.sustainability(g,p,A.context(g,p));assert(plan.ids.includes('humans_deep_ore'),'a newly charted viable mine remains available');
}
console.log('PASS impossible cliff mines switch to paid trade using private terrain knowledge');

{
 const g=arena('apocalypse'),p=g.players[0],w=g.spawnUnit('humans_u0',0,16,12);
 for(let y=0;y<42;y++)g.tile(20,y).height=4;
 const a=g.add({kind:'resource',resource:0,x:24,y:12,hp:1,amount:5000,maxAmount:5000,size:.85}),b=g.add({kind:'resource',resource:0,x:16,y:27,hp:1,amount:5000,maxAmount:5000,size:.85});chart(g);p.knowledge[a.id]={...a};p.knowledge[b.id]={...b};
 E.step(g,p,A.context(g,p));const state=p.aiState.economy;assert.equal(state.workers[w.id].node,b.id,'use the shorter real round trip rather than the closer deposit behind the cliff');assert(state.routes[w.id+':'+a.id].travel>state.routes[w.id+':'+b.id].travel*2);assert(state.haulRoutes[a.id].length>state.haulRoutes[b.id].length*2);
}
console.log('PASS resource choices account for actual outward and return routes around winding terrain');

for(const [enemyType,cooldown,expected]of [['humans_u5',.6,'move'],['humans_u3',.6,'attack'],['humans_u5',0,'attack']]){
 const g=arena('expert'),p=g.players[0],u=g.spawnUnit('humans_u2',0,24,24),enemy=g.spawnUnit(enemyType,1,28.5,24);u.cooldown=cooldown;chart(g);C.step(g,p,A.context(g,p));assert.equal(u.order?.kind,expected);
 if(expected==='move')assert(Math.hypot(u.order.x-enemy.x,u.order.y-enemy.y)>Math.hypot(u.x-enemy.x,u.y-enemy.y),'move away during cooldown when real range and speed permit');
}
console.log('PASS stronger ranged micro uses real range advantages without forfeiting a ready shot');

for(const ore of [0,10]){
 const g=arena('apocalypse'),p=g.players[0];p.faction='machines';p.stock[0]=ore;const u=g.spawnUnit('machines_u2',0,16,12);u.hp=u.maxHp*.2;g.spawnUnit('humans_u2',1,20,12);chart(g);C.step(g,p,A.context(g,p));assert.equal(!!(u.aiWithdrawUntil>g.time),ore>0,'machine self-repair requires actual Ore');
}
console.log('PASS mechanical healing retreats require real repair funds');

{
 const g=arena('nightmare'),p=g.players[0];g.time=30;p.stock=[500,60,60,10];for(let i=0;i<5;i++)g.spawnUnit('humans_u0',0,18+i*.2,14);const n=g.add({kind:'resource',resource:0,x:20,y:16,hp:1,amount:300,maxAmount:300,size:.85});chart(g);p.knowledge[n.id]={...n};
 let plan=E.sustainability(g,p,A.context(g,p));assert(plan.tradeFirst,'recognize an unfundable drilling chain before spending the last deposit');assert(!E.protectedSpend(p,D.research.humans_economy));assert(!E.protectedSpend(p,D.buildings.humans_b3));assert(E.protectedSpend(p,D.buildings.humans_b2),'allow the real market prerequisite');assert(E.protectedSpend(p,D.buildings.humans_market));assert(E.protectedSpend(p,D.units.humans_merchant));
 g.spawnBuilding('humans_market',0,12,28,true);g.spawnBuilding('humans_market',0,30,28,true);g.spawnUnit('humans_merchant',0,16,28);chart(g);plan=E.sustainability(g,p,A.context(g,p));assert(!plan.tradeFirst,'release the investment deferral once the paid trading fallback exists');
}
console.log('PASS poor openings finance a complete trading fallback before consuming capital on drilling research');

{
 const g=arena('expert'),p=g.players[0];g.time=35;p.stock=[1600,200,200,0];for(let i=0;i<6;i++)g.spawnUnit('humans_u0',0,18+i*.2,14);
 for(const r of [0,1,3]){const n=g.add({kind:'resource',resource:r,x:22+r*4,y:20,hp:1,amount:250,maxAmount:250,size:.85});p.knowledge[n.id]={...n};}chart(g);
 let plan=E.sustainability(g,p,A.context(g,p));assert.deepEqual(plan.resources,[0],'finance renewable Ore before three parallel mine investments');assert(!plan.tradeFirst,'missing undiscovered rare resources should allow opening reconnaissance');assert(plan.ids.includes('humans_deep_extraction'));
 g.spawnBuilding('humans_deep_ore',0,24,28,true);chart(g);plan=E.sustainability(g,p,A.context(g,p));assert(plan.resources.includes(1),'resume the secondary renewable chain after the Ore investment is paid');
}
console.log('PASS renewable investments are sequenced around Ore without forgetting secondary resources');
for(const faction of Object.keys(D.factions)){
 const g=arena('expert'),p=g.players[0];p.faction=faction;p.stock=[1000,500,500,32];p.tech=[faction+'_economy'];g.time=200;g.spawnUnit(faction+'_u0',0,18,14);const advanced=D.research[faction+'_advanced'];p.tech=[...advanced.requires];g.spawnBuilding(advanced.building,0,24,24,true);g.spawnBuilding(faction+'_market',0,36,24,true);chart(g);
 p.aiSustainability={cost:[1800,500,500,65],ids:[advanced.id],resourceWise:true};p.aiState={economy:{goal:'research:'+advanced.id}};p.tradeCredits=20;
 require('../src/ai-logistics').step(g,p,A.context(g,p));assert.equal(p.stock[3],42,faction+' must buy the missing research ingredient before unnecessary Ore');assert.equal(p.tradeCredits,0,'the ordinary exchange price is paid');assert.equal(p.stock[0],1000);
}
console.log('PASS all twelve civilizations purchase actionable research ingredients at normal trade prices');

{
 const g=arena('apocalypse'),p=g.players[0];g.time=30;p.stock=[700,60,60,10];for(let i=0;i<20;i++)g.spawnUnit('humans_u0',0,18+(i%5)*.3,14+Math.floor(i/5)*.3);const n=g.add({kind:'resource',resource:0,x:22,y:20,hp:1,amount:100,maxAmount:100,size:.85});chart(g);p.knowledge[n.id]={...n};
 const plan=E.sustainability(g,p,A.context(g,p));assert(plan.tradeFirst.includes('humans_b1'));assert(plan.ids.includes('humans_b1'));assert(E.protectedSpend(p,D.buildings.humans_b1),'recovery must permit real housing for its merchant');assert(!E.protectedSpend(p,D.research.humans_economy));
 E.step(g,p,A.context(g,p));assert(g.entities.some(e=>e.type==='humans_b1'&&e.progress<1),'actually pay for and construct the required population capacity');
}
console.log('PASS a population-blocked trading recovery funds real housing before optional research');

{
 const g=arena('nightmare'),p=g.players[0];g.time=30;p.stock=[180,60,60,10];for(let i=0;i<5;i++)g.spawnUnit('humans_u0',0,18+i*.2,14);g.spawnBuilding('humans_b2',0,12,24,true);const n=g.add({kind:'resource',resource:0,x:42,y:12,hp:1,amount:6000,maxAmount:6000,size:.85});chart(g);p.knowledge[n.id]={...n};
 const plan=E.sustainability(g,p,A.context(g,p));assert(plan.collectionRecovery);assert(plan.ids.includes('humans_orewell'));let collectionPaid=null;const build=g.build;g.build=function(type,owner,...args){const before=p.stock[0],result=build.call(this,type,owner,...args);if(result.ok&&type==='humans_orewell')collectionPaid=before-p.stock[0];return result;};for(let i=0;i<600&&!g.entities.some(e=>e.type==='humans_orewell');i++){if(i%10===0)E.step(g,p,A.context(g,p));g.tick(.1);}assert(g.entities.some(e=>e.type==='humans_orewell'&&e.progress<1),'a five-worker distant opening must establish collection before a speculative laboratory');assert.equal(collectionPaid,D.buildings.humans_orewell.cost[0]);assert(!g.entities.some(e=>e.type==='humans_b3'));
}
console.log('PASS a five-worker opening funds actual remote Ore collection before speculative technology');
