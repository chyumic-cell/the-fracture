'use strict';
const assert=require('node:assert/strict'),D=require('../src/data'),{Game}=require('../src/simulation'),A=require('../src/ai'),E=require('../src/ai-economy'),C=require('../src/ai-combat');
function arena(tier='apocalypse'){
 const g=new Game({size:80,seed:17,startPositions:'ring',factions:['humans','humans'],difficulty:tier});g.entities=[];
 g.players.forEach((p,i)=>{p.ai=false;p.home={x:i?70:8,y:i?70:8};p.knowledge={};});
 g.map.forEach(t=>Object.assign(t,{height:0,water:false}));g.spawnBuilding('humans_b0',0,8,8,true);return g;
}
function chart(g){g.rebuildNav();g.updateVision();const p=g.players[0];p.explored.fill(1);p.knownNav.set(g.nav);p.knownTiles.fill(0);g.pathCache?.clear();}
function troops(g,n,x=20,y=20,type='humans_u2'){return Array.from({length:n},(_,i)=>g.spawnUnit(type,0,x+i*.35,y));}
function ctx(g){return A.context(g,g.players[0]);}
let count=0;function test(name,fn){fn();count++;console.log('PASS '+name);}
test('All twelve civilizations evaluate aircraft counters using actual air and aa fields',()=>{
 for(const f of Object.values(D.factions)){
  const air=f.units.find(u=>u.air&&u.damage>0&&!u.transport),aa=f.units.find(u=>u.aa&&u.damage>0&&!u.naval),ground=f.units.find(u=>!u.aa&&!u.airOnly&&u.damage>0&&!u.worker);
  assert(air&&aa&&ground,f.id);const enemy=[{kind:'unit',type:air.id,seenAt:40}];
  assert(E.counterDemand(aa,enemy,[],40)>E.counterDemand(ground,enemy,[],40),f.id+' failed air counter ranking');
  assert.equal(E.counterDemand(aa,enemy,[],120),0,'Stale intelligence must not dictate counters');
 }
});
test('Counter purchases diminish once queued and fielded counters cover the threat',()=>{
 const u=D.units.humans_u3,t=[{kind:'unit',type:'humans_u7',seenAt:40}];
 assert(E.counterDemand(u,t,[],40)>E.counterDemand(u,t,Array(8).fill(u),40));
});
test('Reinforcements never steal either raid or the secondary attack',()=>{
 const g=arena(),p=g.players[0],front=troops(g,8,40),reserve=troops(g,12,15);chart(g);g.time=400;
 p.operation={ids:front.map(u=>u.id),initial:8,phase:'advance',changed:300,target:{x:65,y:65}};
 p.aiRaid={ids:reserve.slice(0,2).map(u=>u.id)};p.aiRaidExtra={ids:reserve.slice(2,4).map(u=>u.id)};p.aiSecondary={ids:reserve.slice(4,7).map(u=>u.id)};
 C.reinforce(g,p,ctx(g));for(const id of C.detachedIds(p))assert(!p.operation.ids.includes(id));
 assert(p.operation.ids.length>8,'Unused reserves should still reinforce');
 assert(reserve.slice(7).some(u=>!p.operation.ids.includes(u.id)),'Keep a home reserve');
});
test('Secondary attacks continue toward remembered objectives instead of cancelling outside vision',()=>{
 const g=arena(),p=g.players[0],us=troops(g,4),goal=g.spawnBuilding('humans_orewell',1,65,60,true);chart(g);g.time=400;
 p.knowledge[goal.id]={...goal};p.aiSecondary={ids:us.map(u=>u.id),target:goal.id,goal:{x:65,y:60},started:390};
 C.tickSecondary(g,p,ctx(g));assert(p.aiSecondary,'Fog incorrectly ended the mission');
 for(const u of us){u.x=goal.x-3;u.y=goal.y;}goal.hp=0;g.updateVision();
 C.tickSecondary(g,p,ctx(g));assert.equal(p.aiSecondary,null,'A visibly destroyed target must end the mission');
});
test('A secondary attack requires a reachable, weakly guarded separate target',()=>{
 const g=arena(),p=g.players[0],main=troops(g,8,30),fresh=troops(g,6,20),goal=g.spawnBuilding('humans_orewell',1,35,45,true);chart(g);g.time=400;
 p.knowledge[goal.id]={...goal};p.operation={ids:main.map(u=>u.id),phase:'advance',target:{id:999,x:65,y:20}};
 const c=ctx(g);C.secondaryPressure(g,p,c);assert(p.aiSecondary,'Reachable exposed objective was ignored');
 p.aiSecondary=null;const actualPath=g.path;g.path=()=>[];C.secondaryPressure(g,p,c);assert(!p.aiSecondary,'Unreachable target accepted');g.path=actualPath;
});
test('Successful defense opens a counterattack window without bypassing normal force checks',()=>{
 const g=arena('challenging'),p=g.players[0],us=troops(g,9);chart(g);g.time=200;p.attackAt=500;p.defenseIds=us.slice(0,3).map(u=>u.id);
 C.defend(g,p,ctx(g));assert.equal(p.attackAt,200);assert.equal(p.aiCounterattackUntil,218);assert.deepEqual(p.defenseIds,[]);
});
test('Two economic raids use disjoint soldiers and distinct observed targets',()=>{
 const g=arena(),p=g.players[0];troops(g,16,28,28,'humans_u1');g.spawnUnit('humans_u0',1,32,28);g.spawnUnit('humans_u0',1,32,31);chart(g);g.time=400;
 const c=ctx(g);C.raid(g,p,c);C.raidExtra(g,p,c);assert(p.aiRaid&&p.aiRaidExtra);
 assert.notEqual(p.aiRaid.target,p.aiRaidExtra.target);assert(p.aiRaid.ids.every(id=>!p.aiRaidExtra.ids.includes(id)));
 const restored=Game.restore(g.serialize());assert.deepEqual(restored.players[0].aiRaidExtra,p.aiRaidExtra);
});
test('Choke detection uses discovered bends and never reads actual hidden navigation',()=>{
 const g=arena(),p=g.players[0];g.spawnUnit('humans_u0',0,8,10);p.knowledge[999]={id:999,kind:'building',type:'humans_b0',owner:1,x:70,y:70};
 p.explored.fill(1);g.time=100;g.approach=()=>({x:68,y:68});
 const route=[{x:10,y:10},{x:10,y:15},{x:10,y:20},{x:10,y:35},{x:10,y:40},{x:15,y:40},{x:25,y:40},{x:40,y:40},{x:68,y:68}];g.path=()=>route;
 g.blocked=(x,y,air,owner,actual)=>{assert.equal(owner,0);assert(!actual,'Choke scan leaked actual terrain');return Math.abs(x-10)>2.5&&Math.abs(y-40)>2.5;};
 let points=E.findChokePoints(g,p,A.configFor('veteran'));assert(points.length);assert(points.some(q=>q.x<15||Math.abs(q.y-40)<1));
 p.explored.fill(0);g.time+=21;assert.deepEqual(E.findChokePoints(g,p,A.configFor('veteran')),[]);
});
console.log('TOTAL '+count+' operational repair groups passed');
