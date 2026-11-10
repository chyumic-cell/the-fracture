'use strict';
const assert=require('node:assert/strict'),D=require('../src/data.js'),{Game}=require('../src/simulation.js');
let count=0;function test(name,fn){fn();count++;console.log('PASS '+name);}
function arena(){const g=new Game({size:48,factions:['humans','humans'],seed:7});g.players.forEach(p=>{p.ai=false;p.stock=[3000,3000,3000,3000];p.knowledge={};p.explored.fill(0);p.visible.fill(0);p.knownNav.fill(0);});g.entities=[];for(const t of g.map)Object.assign(t,{water:false,height:0});g.spawnBuilding('humans_b0',0,8,8,true);g.spawnBuilding('humans_b3',0,8,14,true);g.players[0].tech.push('humans_economy');g.spawnBuilding('humans_b0',1,42,42,true);const w=g.spawnUnit('humans_u0',0,20.5,23.5);g.rebuildNav();g.updateVision();return{g,w};}
function tree(g,x=20.5,y=20.5){return g.add({kind:'tree',x,y,hp:1,size:.4,variant:0});}
function resource(g,amount=200,x=20.5,y=20.5,r=0){return g.add({kind:'resource',resource:r,x,y,hp:1,amount,maxAmount:200,size:.85});}
const house=D.buildings.humans_b1;
test('Trees permit previews without mutation and clear only after successful paid construction',()=>{
 const {g,w}=arena(),near=tree(g),edge=tree(g,22.4,20.5),far=tree(g,26.5,20.5);g.rebuildNav();g.updateVision();
 const before=[...g.players[0].stock],edgeTile=20*g.n+22;assert(g.players[0].knowledge[near.id]);assert.equal(g.nav[edgeTile],1);
 assert.equal(g.placement(house.id,0,20.5,20.5),null);assert.deepEqual(g.placementBlockers(house.id,0,20.5,20.5),[]);assert.equal(near.hp,1);assert.equal(edge.hp,1);assert.deepEqual(g.players[0].stock,before);
 assert.equal(g.build(house.id,0,20.5,20.5,[]).ok,false);assert.equal(near.hp,1);assert.deepEqual(g.players[0].stock,before);
 const result=g.build(house.id,0,20.5,20.5,[w.id]);assert(result.ok);assert.equal(result.building.progress,0);assert.equal(near.hp,0);assert.equal(edge.hp,0);assert.equal(far.hp,1);assert.deepEqual(g.players[0].stock,before.map((v,i)=>v-house.cost[i]));assert.equal(w.order.target,result.building.id);
 assert.equal(g.nav[edgeTile],0);assert.equal(g.players[0].knownNav[edgeTile],0);assert(!g.players[0].knowledge[near.id]);assert(g.players[0].knowledge[result.building.id]);
});
test('Unpaid, prerequisite-blocked, and unseen building attempts never clear trees',()=>{
 for(const failure of ['money','prerequisite','fog']){const {g,w}=arena(),t=tree(g);g.rebuildNav();g.updateVision();let type=house.id;if(failure==='money')g.players[0].stock=[0,0,0,0];if(failure==='prerequisite')type='humans_b4';if(failure==='fog'){g.players[0].visible.fill(0);g.players[0].explored.fill(0);}const before=[...g.players[0].stock];assert.equal(g.build(type,0,20.5,20.5,[w.id]).ok,false,failure);assert.equal(t.hp,1);assert.deepEqual(g.players[0].stock,before);}
});
test('Visible resource and building blockers are named and outlined; trees do not hide them',()=>{
 const {g,w}=arena(),t=tree(g),node=resource(g);g.rebuildNav();g.updateVision();assert.match(g.placement(house.id,0,20.5,20.5),/Ore deposit/);const blockers=g.placementBlockers(house.id,0,20.5,20.5);assert.equal(blockers.length,1);assert.equal(blockers[0].id,node.id);assert.equal(blockers[0].size,node.size);assert.equal(blockers[0].name,'Ore deposit');assert.equal(g.build(house.id,0,20.5,20.5,[w.id]).ok,false);assert.equal(t.hp,1);assert.equal(node.amount,200);
 node.hp=0;const b=g.spawnBuilding('humans_b2',1,20.5,20.5,true);g.rebuildNav();g.updateVision();assert.match(g.placement(house.id,0,20.5,20.5),/Barracks/);assert(g.placementBlockers(house.id,0,20.5,20.5).some(e=>e.id===b.id));
});
test('Depleted and dead deposits cannot invisibly block a foundation',()=>{
 for(const [hp,amount]of [[1,0],[0,100]]){const {g,w}=arena(),node=resource(g,amount);node.hp=hp;g.rebuildNav();g.updateVision();assert.equal(g.placement(house.id,0,20.5,20.5),null);assert.equal(g.placementBlockers(house.id,0,20.5,20.5).length,0);assert(g.build(house.id,0,20.5,20.5,[w.id]).ok);}
});
test('Every touched footprint tile must be explored and unseen terrain is never disclosed',()=>{
 const {g}=arena(),index=21*g.n+22;g.players[0].visible[index]=0;g.players[0].explored[index]=0;assert.equal(g.placement(house.id,0,20.9,20.9),'Explore the entire building site first');g.map[index].water=true;assert.equal(g.placement(house.id,0,20.9,20.9),'Explore the entire building site first');g.players[0].visible[index]=1;g.players[0].explored[index]=1;assert.equal(g.placement(house.id,0,20.9,20.9),'Needs dry ground');
 assert.equal(g.placement(house.id,0,NaN,20),'Outside the map');
});
test('Hidden live changes do not alter previews or disclose enemy names on a failed commit',()=>{
 const {g,w}=arena(),p=g.players[0];p.visible.fill(0);for(let y=19;y<=21;y++)for(let x=19;x<=21;x++)p.visible[y*g.n+x]=1;const before=g.placement(house.id,0,20.5,20.5);assert.equal(before,null);
 const hidden=g.spawnBuilding('humans_b4',1,23.5,20.5,true);g.rebuildNav();assert.equal(g.visible(0,hidden),false);assert.equal(g.placement(house.id,0,20.5,20.5),before);assert.deepEqual(g.placementBlockers(house.id,0,20.5,20.5),[]);
 const stock=[...p.stock],result=g.build(house.id,0,20.5,20.5,[w.id]);assert.equal(result.ok,false);assert.match(result.reason,/survey/i);assert(!result.reason.includes('Vehicle'));assert.deepEqual(p.stock,stock);
});
test('Remembered obstruction remains private until observed again',()=>{
 const {g}=arena(),p=g.players[0],b=g.spawnBuilding('humans_b4',1,23.5,20.5,true);g.rebuildNav();g.updateVision();assert(p.knowledge[b.id]);p.visible[20*g.n+23]=0;const before=g.placement(house.id,0,20.5,20.5);assert.match(before,/survey/i);b.hp=0;assert.equal(g.placement(house.id,0,20.5,20.5),before);assert.deepEqual(g.placementBlockers(house.id,0,20.5,20.5),[]);
});
test('Paid extensions clear decorative trees, while failed extension orders preserve them',()=>{
 const {g}=arena(),b=g.spawnBuilding('humans_b2',0,20.5,20.5,true),point={x:b.x+g.def(b).size+1.2,y:b.y},t=tree(g,point.x,point.y),ex=D.factions.humans.extensions.find(x=>x.building===b.type);g.rebuildNav();g.updateVision();assert(g.extensionFits(b));const before=[...g.players[0].stock];g.players[0].stock=[0,0,0,0];assert.equal(g.queue(b.id,ex.id,'extension').ok,false);assert.equal(t.hp,1);g.players[0].stock=[...before];assert(g.queue(b.id,ex.id,'extension').ok);assert.equal(t.hp,0);assert.deepEqual(g.players[0].stock,before.map((v,i)=>v-ex.cost[i]));assert(!g.players[0].knowledge[t.id]);
 const spot={x:point.x+1,y:point.y};assert.match(g.placement(house.id,0,spot.x,spot.y),/extension/);const blocker=g.placementBlockers(house.id,0,spot.x,spot.y).find(e=>e.extension);assert(blocker);assert.equal(blocker.x,point.x);assert.equal(blocker.size,.5);g.cancelQueue(b.id,0);assert.match(g.placement(house.id,0,spot.x,spot.y),/Reserved future extension/);
 b.extension=ex.name;g.rebuildNav();assert.match(g.placement(house.id,0,spot.x,spot.y),/extension/);
});
test('Visible extension obstructions are named and empty deposits do not block an extension',()=>{
 const {g}=arena(),b=g.spawnBuilding('humans_b2',0,20.5,20.5,true),node=resource(g,100,23.7,20.5),ex=D.factions.humans.extensions.find(x=>x.building===b.type);g.rebuildNav();g.updateVision();assert.equal(g.extensionFits(b),false);assert.match(g.queue(b.id,ex.id,'extension').reason,/Ore deposit/);node.amount=0;g.rebuildNav();assert(g.extensionFits(b));assert(g.queue(b.id,ex.id,'extension').ok);
});
test('Tree clearing refreshes only visible knowledge and survives save/load',()=>{
 const {g,w}=arena(),t=tree(g,22.4,20.5),enemy=g.spawnUnit('humans_u1',1,23,24);g.rebuildNav();g.updateVision();assert(g.players[1].knowledge[t.id]);enemy.x=42;enemy.y=42;g.updateVision();assert.equal(g.visible(1,t),false);const index=20*g.n+22,remembered=g.players[1].knownNav[index];assert.equal(remembered,1);
 assert(g.build(house.id,0,20.5,20.5,[w.id]).ok);assert(!g.players[0].knowledge[t.id]);assert(g.players[1].knowledge[t.id]);assert.equal(g.players[1].knownNav[index],remembered);
 const saved=Game.restore(g.serialize());assert(!saved.entity(t.id));assert(saved.players[1].knowledge[t.id]);assert.equal(saved.players[1].knownNav[index],remembered);
});
console.log('TOTAL '+count+' building placement checks passed');
