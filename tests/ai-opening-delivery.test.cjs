"use strict";
const assert=require('node:assert/strict'),D=require('../src/data'),{Game}=require('../src/simulation'),A=require('../src/ai'),E=require('../src/ai-economy');
for(const kind of ['gather','returnCargo','extract']){
 const g=new Game({size:64,seed:42,factions:['reptilians','humans']});g.entities=[];g.map.forEach(t=>Object.assign(t,{water:false,height:0}));g.players.forEach(p=>{p.ai=false;p.stock=[0,0,0,0]});
 g.spawnBuilding('reptilians_b0',0,29,73-20,true);const drop=g.spawnBuilding('reptilians_aetherwell',0,23.931819893333106,74.16570871786851-20,true);
 const mine=g.spawnBuilding('reptilians_deep_ore',0,33,49,true),node=g.add({kind:'resource',resource:2,x:35,y:50,hp:1,amount:600,size:.85});
 const u=g.spawnUnit('reptilians_u0',0,26.735,55.5);u.carry=12;u.carryType=2;u.order={kind,target:kind==='extract'?mine.id:node.id};g.rebuildNav();g.updateVision();
 for(const p of g.players){p.explored.fill(1);p.knownNav.set(g.nav);p.knownTiles.fill(0)}
 const q=g.approach(u,drop,1);assert(Math.hypot(u.x-q.x,u.y-q.y)<.25);assert(Math.hypot(u.x-drop.x,u.y-drop.y)>drop.size+1.8);
 for(let i=0;i<60&&u.carry;i++){if(kind==='extract')g.tickDeepWorker(u,.15);else g.tickWorker(u,.15);g.time+=.15;}
 assert.equal(u.carry,0,kind+' must not stop just outside delivery range');assert.equal(g.players[0].gathered[2],12);assert.equal(g.players[0].stock[2],12);
 console.log('PASS physical '+kind+' delivery through the reproduced rounding deadlock, without extra income');
}
{
 const g=new Game({size:64,seed:17,startingResources:false,factions:['humans','humans'],difficulty:'nightmare'});g.entities=[];g.map.forEach(t=>Object.assign(t,{water:false,height:0}));g.players.forEach(p=>{p.ai=false;p.knowledge={}});const p=g.players[0];p.home={x:12,y:12};g.spawnBuilding('humans_b0',0,12,12,true);g.spawnBuilding('humans_b0',1,54,54,true);for(let i=0;i<5;i++)g.spawnUnit('humans_u0',0,16+i*.3,13);
 const r=g.add({kind:'resource',resource:3,x:22,y:12,hp:1,amount:300,size:.85});p.knowledge[r.id]={...r};g.rebuildNav();g.updateVision();p.explored.fill(1);p.knownNav.set(g.nav);p.knownTiles.fill(0);g.time=90;
 const stock=[...p.stock],plan=E.sustainability(g,p,A.context(g,p));assert(plan.bootstrap);assert(!plan.tradeFirst);assert(!plan.ids.some(id=>id.includes('deep_')));E.step(g,p,A.context(g,p));assert.deepEqual(p.stock,stock,'do not spend opening Ore on a speculative rare-resource research chain');
 const n=g.add({kind:'resource',resource:0,x:32,y:12,hp:1,amount:2400,size:.85});p.knowledge[n.id]={...n};g.updateVision();p.visible.fill(1);E.step(g,p,A.context(g,p));assert(g.entities.some(e=>e.type==='humans_orewell'),'first productive Ore collection is actually funded');assert(!g.entities.some(e=>e.type==='humans_oilwell'||e.type==='humans_b2'));
 console.log('PASS no-home-deposit opening saves capital until it can fund a real Ore delivery route');
}

for(const difficulty of ['standard','challenging','veteran','expert','master','nightmare','apocalypse']){
 const g=new Game({size:64,seed:17,factions:['humans','humans'],difficulty});g.entities=[];g.map.forEach(t=>Object.assign(t,{water:false,height:0}));g.players.forEach(p=>{p.ai=false;p.knowledge={}});const p=g.players[0];p.home={x:12,y:12};p.stock=[120,60,60,10];p.gathered[0]=24;const hq=g.spawnBuilding('humans_b0',0,12,12,true),b=g.spawnBuilding('humans_b2',0,12,22,true);g.spawnBuilding('humans_b0',1,54,54,true);g.spawnBuilding('humans_orewell',0,31,15,true);for(let i=0;i<5;i++)g.spawnUnit('humans_u0',0,16+i*.3,13);const n=g.add({kind:'resource',resource:0,x:32,y:12,hp:1,amount:6000,size:.85});p.knowledge[n.id]={...n};g.rebuildNav();g.updateVision();p.explored.fill(1);p.visible.fill(1);p.knownNav.set(g.nav);p.knownTiles.fill(0);g.time=160;
 E.step(g,p,A.context(g,p));assert(!hq.queue.length,difficulty+' expanded unprotected workforce first');assert(b.queue.length,difficulty+' did not fund an escort');assert(D.units[b.queue[0].type].damage>0);assert.notEqual(D.units[b.queue[0].type].role,'scout');assert.equal(p.stock[0],120-D.units[b.queue[0].type].cost[0]);
}
console.log('PASS seven stronger tiers purchase real combat escorts before expanding exposed remote workforces');

{
 const g=new Game({size:64,seed:17,factions:['reptilians','humans'],difficulty:'standard'});g.entities=[];g.map.forEach(t=>Object.assign(t,{water:false,height:0}));g.players.forEach(p=>{p.ai=false;p.knowledge={}});const p=g.players[0];p.home={x:12,y:12};p.stock=[800,300,250,34.57];p.tech=['reptilians_economy','reptilians_weapons1'];g.spawnBuilding('reptilians_b0',0,12,12,true);g.spawnBuilding('reptilians_b3',0,18,12,true);g.spawnBuilding('reptilians_b2',0,12,20,true);g.spawnBuilding('humans_b0',1,54,54,true);
 g.spawnBuilding('reptilians_b1',0,30,12,true);g.spawnBuilding('reptilians_b1',0,35,12,true);for(let i=0;i<10;i++)g.spawnUnit('reptilians_u0',0,14+i*.3,16);
 for(const [resource,x,y,amount]of [[0,22,18,900],[1,8,20,1000],[2,20,26,1000],[3,8,26,500]]){const n=g.add({kind:'resource',resource,x,y,hp:1,amount,size:.85});p.knowledge[n.id]={...n};}
 g.spawnBuilding('reptilians_oilwell',0,8,23,true);g.spawnBuilding('reptilians_riftwell',0,8,26,true);g.rebuildNav();g.updateVision();p.explored.fill(1);p.visible.fill(1);p.knownNav.set(g.nav);p.knownTiles.fill(0);g.time=240;
 E.step(g,p,A.context(g,p));assert.equal(p.aiState.economy.goal,'research:reptilians_advanced');assert(p.aiState.economy.desiredWorkers[3]>=1,'missing 0.43 Rift Crystals must receive a worker before aggregate Ore demand');assert(g.entities.some(u=>u.owner===0&&u.order?.kind==='gather'&&g.entity(u.order.target)?.resource===3));
 console.log('PASS stronger AI staffs the missing ingredient of funded drilling research');
}

{
 const g=new Game({size:100,seed:42,layout:'narrows',startPositions:'ring',factions:['primates','primates'],resourceAmount:.5,resourcePlacement:'random',startingResources:true});g.players.forEach((p,i)=>{p.ai=true;p.aiDifficulty=i?'veteran':'expert';});let houseAt=null;const build=g.build;g.build=function(type,owner,...args){const before=[...this.players[owner].stock],result=build.call(this,type,owner,...args);if(result.ok&&owner===0&&type==='primates_b1'&&houseAt===null){houseAt=this.time;assert.deepEqual(this.players[owner].stock,before.map((n,i)=>n-D.buildings[type].cost[i]));const plan=this.players[owner].aiSustainability;if(!plan.ids.includes(type))assert(this.players[owner].stock[0]+plan.liquidRemaining[0]>=plan.cost[0],'unplanned housing must preserve enough actual supplies to finance drilling');}return result;};let capped=0;for(let i=0;i<4000&&houseAt===null;i++){g.tick(.15);if(g.population(0)>=g.capacity(0))capped+=.15;}assert(houseAt!==null,'Expert must build housing');assert(capped<30,'Expert must not sit population-constrained with accessible supplies ('+capped.toFixed(0)+'s at the cap)');console.log('PASS upper-tier housing funds the next production wave without consuming drilling capital');
}
