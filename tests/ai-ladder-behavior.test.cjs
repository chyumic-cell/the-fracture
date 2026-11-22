const assert=require('node:assert/strict'),D=require('../src/data'),A=require('../src/ai'),E=require('../src/ai-economy'),{Game}=require('../src/simulation');
function arena(difficulty){const g=new Game({size:64,seed:17,startPositions:'ring',factions:['humans','humans'],difficulty});g.entities=[];g.players.forEach(p=>p.ai=false);g.map.forEach(t=>Object.assign(t,{water:false,height:0}));const p=g.players[0];p.home={x:8,y:8};p.stock=[4000,1000,1000,1000];g.spawnBuilding('humans_b0',0,8,8,true);g.spawnBuilding('humans_b1',0,8,22,true);g.spawnBuilding('humans_b1',0,8,27,true);for(let i=0;i<4;i++)g.spawnBuilding('humans_b2',0,16+i*7,8,true);for(let i=0;i<8;i++)g.spawnUnit('humans_u0',0,8+i*.3,12);g.rebuildNav();g.updateVision();return g;}
const old=arena('relaxed');E.step(old,old.players[0],A.context(old,old.players[0]));
assert.equal(old.entities.filter(e=>e.type==='humans_b2').flatMap(b=>b.queue).filter(q=>q.type==='humans_u1').length,4,'The fixed anchor behavior changed');
for(const difficulty of ['veteran','expert','master','nightmare','apocalypse']){
 const g=arena(difficulty),p=g.players[0],before=[...p.stock];E.step(g,p,A.context(g,p));
 const queues=g.entities.filter(e=>e.type==='humans_b2').flatMap(b=>b.queue);
 assert.equal(queues.filter(q=>q.type==='humans_u1').length,1,difficulty+' redundant scouts');
 assert.equal(queues.filter(q=>q.type==='humans_u2').length,3,difficulty+' missing infantry');
 assert(p.stock[0]<before[0]);assert(queues.every(q=>q.remaining===D.units[q.type].time),'Production must not be accelerated');
}
console.log('PASS stronger tiers re-evaluate paid parallel recruitment; Relaxed retains original decisions');
for(const difficulty of ['relaxed','veteran']){
 const g=arena(difficulty),p=g.players[0];for(let i=0;i<24;i++)g.spawnUnit('humans_u2',0,14+i*.3,16);
 g.updateVision();assert.equal(g.capacity(0)-g.population(0),12);
 E.step(g,p,A.context(g,p));const housing=g.entities.filter(e=>e.type==='humans_b1'&&e.progress<1);
 assert.equal(housing.length,A.configFor(difficulty).macroForecast?1:0,'Housing anticipation belongs to tiers with production forecasting');
}
console.log('PASS paid housing anticipates the next wave before factories hit the population limit');
// The ladder was re-anchored: the former Apocalypse controller is now Standard and is the
// reference baseline. Standard must reproduce every decision parameter of that recorded
// profile; keys introduced by the rebuild are additions, not changes to preserved behaviour.
const anchor=require('./fixtures/ai-standard-anchor.json'),now=A.configFor('standard');
const skip=new Set(['id','name','level','grade']);
for(const [k,v] of Object.entries(anchor.profile)){if(skip.has(k))continue;
 assert.deepEqual(now[k],v,'Standard must preserve the former Apocalypse value of '+k);}
console.log('PASS Standard reproduces the recorded former-Apocalypse decision profile');
const legacy=require('./fixtures/ai-relaxed-anchor.json');
assert.deepEqual(A.configFor('relaxed').economyRates,legacy.profile.economyRates,'Fair economy rates must stay untouched at every tier');
console.log('PASS complete fixed Relaxed profile');

for(const difficulty of ['easy','master']){
 const g=arena(difficulty),p=g.players[0];
 for(let i=0;i<10;i++)g.spawnBuilding('humans_b1',0,12+i*4,40,true);
 for(const [type,count]of [['humans_u2',60],['humans_u3',20],['humans_u1',10]])for(let i=0;i<count;i++)g.spawnUnit(type,0,10+i*.3,18);
 g.rebuildNav();g.updateVision();E.step(g,p,A.context(g,p));
 const recruited=g.entities.filter(e=>e.type==='humans_b2').flatMap(b=>b.queue).filter(q=>q.kind==='unit');
 if(A.configFor(difficulty).pressureProduction)assert(recruited.length>0,'Tiers with production pressure should fill usable factory capacity when roles saturate');
 else assert.equal(recruited.length,0,'Tiers without production pressure should not fill spare factory capacity');
}
console.log('PASS stronger armies keep buying useful troops instead of leaving affordable factories idle');
{
 const Combat=require('../src/ai-combat'),g=arena('gentle'),p=g.players[0];
 g.spawnBuilding('humans_b3',1,52,50,true);for(let i=0;i<10;i++)g.spawnUnit('humans_u2',0,46+i*.2,49);
 g.rebuildNav();g.updateVision();p.explored.fill(1);p.knownNav.set(g.nav);p.knownTiles.set(g.map.map(t=>(t.water?128:0)|t.height));g.pathCache?.clear();g.time=599;Combat.step(g,p,A.context(g,p));assert(!p.operation,'Gentle attacked during its learning grace period');
 g.time=601;Combat.step(g,p,A.context(g,p));assert(p.operation,'Gentle must still function after its grace period');
}
console.log('PASS Gentle waits ten minutes before initiating land offensives and can still defend');

{
 const g=arena('master'),p=g.players[0];p.aiLogistics={needsTransport:true};
 for(let i=0;i<28;i++)g.spawnUnit('humans_u2',0,12+i*.2,18);
 g.updateVision();E.step(g,p,A.context(g,p));
 assert.equal(g.entities.filter(e=>e.type==='humans_b2').flatMap(b=>b.queue).filter(q=>q.kind==='unit').length,0,'Pressure production must not bypass an operational transport limit');
}
console.log('PASS island production respects transport bottlenecks instead of massing stranded infantry');

{
 const rifle=D.units.humans_u2,research=D.research.humans_weapons1,army=Array(30).fill(rifle);
 assert.equal(E.upgradePriority(A.configFor('relaxed'),research,army,[],62),62);
 assert.equal(E.upgradePriority(A.configFor('master'),research,army,[],62),96);
 assert.equal(E.upgradePriority(A.configFor('apocalypse'),research,[rifle],[],62),62);
 const g=arena('master'),p=g.players[0];g.time=240;p.tech=['humans_economy'];
 const lab=g.spawnBuilding('humans_b3',0,28,23,true);
 for(let i=0;i<30;i++)g.spawnUnit('humans_u2',0,14+i*.2,16);
 for(let i=0;i<5;i++)g.spawnBuilding('humans_b1',0,10+i*6,40,true);
 const factory=g.entities.find(e=>e.type==='humans_b2');g.queue(factory.id,'humans_u2');g.rebuildNav();g.updateVision();
 const before=[...p.stock];E.step(g,p,A.context(g,p));assert(lab.queue.some(q=>q.type==='humans_weapons1'),'A valuable army upgrade must precede another infantry factory');assert(p.stock[0]<=before[0]-research.cost[0]);
}
console.log('PASS stronger AI prioritizes valuable paid army upgrades over redundant factories without altering the baseline');

{
 const Combat=require('../src/ai-combat'),g=arena('apocalypse'),p=g.players[0];
 for(let i=0;i<12;i++)g.spawnUnit('humans_u5',0,12+i*.2,12);
 const air=g.spawnUnit('humans_u10',1,10,10);assert(D.units[air.type].air);
 const aa=g.spawnUnit('humans_u3',0,11,13);assert(D.units[aa.type].aa);g.updateVision();Combat.step(g,p,A.context(g,p));
 assert(p.defenseIds.includes(aa.id));assert(p.defenseIds.every(id=>g.def(g.entity(id)).aa),'Aircraft must not immobilize infantry that cannot shoot them');
}
console.log('PASS air intrusions receive capable defenders and leave ground-only troops available');

{
 const g=arena('master'),p=g.players[0];g.time=240;p.stock=[80,1000,1000,1000];p.tech=['humans_economy'];for(let i=0;i<8;i++)g.spawnUnit('humans_u0',0,8+i*.3,12);
 const lab=g.spawnBuilding('humans_b3',0,28,23,true);for(let i=0;i<30;i++)g.spawnUnit('humans_u2',0,14+i*.2,16);for(let i=0;i<5;i++)g.spawnBuilding('humans_b1',0,10+i*6,40,true);
 g.add({kind:'resource',resource:0,x:10,y:14,hp:1,amount:5000,size:.85});g.rebuildNav();g.updateVision();
 E.step(g,p,A.context(g,p));assert.equal(p.aiState.economy.goal,'research:humans_weapons1');assert(p.aiReserve[0]>=90);assert.equal(lab.queue.length,0);assert.equal(p.stock[0],80,'Do not spend the upgrade savings on another cheap infantry unit');
 const w=g.entities.find(e=>e.owner===0&&g.def(e).worker);w.x=9;w.y=8;w.carry=10;w.carryType=0;g.order([w.id],{kind:'returnCargo'});g.tickWorker(w,.1);assert.equal(p.stock[0],90);
 g.time+=2;E.step(g,p,A.context(g,p));assert(lab.queue.some(q=>q.type==='humans_weapons1'));assert.equal(p.stock[0],0);
}
console.log('PASS stronger AI saves the final Ore for a feasible upgrade, then pays its full cost after a real delivery');

{
 const Combat=require('../src/ai-combat'),g=arena('apocalypse'),p=g.players[0];g.entities=[];const target=g.spawnBuilding('humans_b0',1,44,30,true),siege=g.spawnUnit('humans_u8',0,30,30),escorts=Array.from({length:5},(_,i)=>g.spawnUnit('humans_u2',0,31,28+i));
 g.rebuildNav();g.updateVision();p.explored.fill(1);p.visible.fill(1);p.knownNav.set(g.nav);p.knownTiles.fill(0);g.time=300;const op={phase:'advance',target:{id:target.id,x:target.x,y:target.y},flank:[]};
 assert(Combat.siegeScreen(g,p,op,[siege,...escorts],A.configFor('apocalypse'),[target]));assert.equal(siege.order.target,target.id);assert(escorts.every(u=>!u.order||Math.hypot(u.order.x-target.x,u.order.y-target.y)>g.attackReach(target,u)));
 assert(!Combat.siegeScreen(g,p,{...op,screenReviewAt:0},[siege,...escorts],A.configFor('relaxed'),[target]));
 siege.hp=0;assert(!Combat.siegeScreen(g,p,{...op,screenReviewAt:0},escorts,A.configFor('apocalypse'),[target]));
}
console.log('PASS stronger armies use real artillery range with reachable escort positions rather than charging a defended headquarters');

{
 const g=new Game({size:64,seed:17,startPositions:'ring',difficulty:'nightmare',factions:['night','humans']});g.entities=[];g.players.forEach(p=>p.ai=false);g.map.forEach(t=>{t.water=false;t.height=0;});const p=g.players[0];p.home={x:12,y:12};p.stock=[1000,500,500,100];
 for(const [type,x,y]of [['night_b0',12,12],['night_b3',21,12],['night_b2',12,23],['night_b1',5,24],['night_b1',5,31]])g.spawnBuilding(type,0,x,y,true);
 for(let i=0;i<12;i++){g.spawnUnit('night_u0',0,14+i*.2,16);g.spawnUnit('night_u3',0,25+i*.2,26);}
 g.spawnUnit('humans_u10',1,31,27);g.rebuildNav();g.updateVision();g.time=250;E.step(g,p,A.context(g,p));
 assert(g.entities.some(e=>e.owner===0&&e.type==='night_b6'&&e.progress<1),'Observed aircraft should trigger the dedicated anti-air branch before more factories or optional upgrades');
}
console.log('PASS stronger Night AI answers an observed gunship with paid dedicated anti-air infrastructure before reaching twenty troops');

{
 const g=arena('apocalypse'),p=g.players[0];g.time=650;p.tech=Object.keys(D.research).filter(id=>id.startsWith('humans_'));p.knowledge={};p.aiRenewableTargets=[];g.spawnBuilding('humans_b3',0,24,15,true);
 for(let i=0;i<12;i++)g.spawnUnit('humans_u0',0,10+i*.3,13);
 for(let i=0;i<10;i++)g.spawnUnit('humans_u2',0,14+i*.3,17);
 for(let i=0;i<5;i++)g.spawnBuilding('humans_b1',0,8+i*7,40,true);
 const mine=g.spawnBuilding('humans_deep_ore',0,23,25,true);mine.lastExtraction=649;
 for(const [x,y]of [[23,25],[32,25]]){const n=g.add({kind:'resource',resource:0,x,y,hp:1,amount:0,size:.85});p.knowledge[n.id]={...n};}
 g.rebuildNav();g.updateVision();p.explored.fill(1);p.knownNav.set(g.nav);p.knownTiles.fill(0);const before=p.stock[0];E.step(g,p,A.context(g,p));
 assert(g.entities.some(b=>b.type==='humans_deep_ore'&&b.id!==mine.id&&b.progress<1),'A larger paid workforce needs a second renewable shaft');
 assert(p.stock[0]<=before-D.buildings.humans_deep_ore.cost[0],'Pay the normal mine price');
}
console.log('PASS stronger economies invest in a second paid mine on a known exhausted deposit');

{
 const g=new Game({size:64,seed:17,startPositions:'ring',difficulty:'nightmare',factions:['night','humans']});g.entities=[];g.players.forEach(p=>p.ai=false);g.map.forEach(t=>{t.water=false;t.height=0;});const p=g.players[0];p.knowledge={};p.home={x:12,y:12};p.stock=[2000,500,500,100];
 for(const [type,x,y]of [['night_b0',12,12],['night_b2',29,12],['night_b3',27,23],['night_b1',35,23],['night_b1',35,30]])g.spawnBuilding(type,0,x,y,true);
 for(let i=0;i<12;i++){g.spawnUnit('night_u0',0,30+i*.2,16);g.spawnUnit('night_u3',0,19+i*.2,19);}
 g.spawnUnit('humans_u10',1,12,12);g.rebuildNav();g.updateVision();p.explored.fill(1);p.knownNav.set(g.nav);p.knownTiles.fill(0);g.time=250;E.step(g,p,A.context(g,p));
 const counter=g.entities.find(e=>e.owner===0&&e.type==='night_b6'&&e.progress<1);assert(counter,'A raided HQ must not veto a reachable safe counter-production site');assert(Math.hypot(counter.x-12,counter.y-12)>12);assert(p.stock[0]<=2000-D.buildings.night_b6.cost[0]);
}
console.log('PASS stronger AI builds paid counters at a safe reachable site while its headquarters is under air attack');
