'use strict';
// Resource-specific collectors: built on their deposit, the only drop-off for their resource (the
// headquarters also takes Ore), upgraded in place into deep mines, and capped in workers.
const assert=require('node:assert/strict'),D=require('../src/data.js'),{Game}=require('../src/simulation.js');
let count=0;function test(name,fn){fn();count++;console.log('PASS '+name);}
function flat(){const g=new Game({size:48,seed:3,factions:['humans','machines']});g.entities=[];g.map.forEach(t=>{t.water=false;t.height=0;});
 g.players.forEach(p=>{p.ai=false;p.explored.fill(1);p.visible.fill(1);p.stock=[3000,3000,3000,3000];});g.spawnBuilding('humans_b0',0,8,8,true);g.spawnBuilding('machines_b0',1,40,40,true);g.spawnUnit('humans_u1',0,19,15);g.rebuildNav();g.updateVision();return g;}
const node=(g,r,x,y,amount=900)=>g.add({kind:'resource',resource:r,x,y,hp:1,amount,maxAmount:amount,size:r===3?.65:.85});
function run(g,s){for(let i=0;i<s*10;i++)g.tick(.1);}

test('Collectors are built on top of their own deposit and snap onto it',()=>{
 const g=flat(),n=node(g,2,20.5,20.5);g.rebuildNav();g.updateVision();
 assert.match(g.placement('humans_aetherwell',0,26,26),/on top of a Aetherite deposit/);
 assert.match(g.placement('humans_oilwell',0,20.5,20.5),/Lastrian Oil/);
 assert.equal(g.placement('humans_aetherwell',0,20.9,21.2),null);
 const w=g.spawnUnit('humans_u0',0,16,16),r=g.build('humans_aetherwell',0,21,21.3,[w.id]);assert(r.ok);assert.equal(r.building.x,n.x);assert.equal(r.building.y,n.y);
});
test('General stores and deep mines cannot be placed directly',()=>{
 const g=flat(),store=D.factions.machines.buildings.find(b=>b.kind==='depot');node(g,0,20.5,20.5,0);
 assert.match(g.placement(store.id,1,30,30),/own collector/);assert.match(g.placement('humans_deep_ore',0,20.5,20.5),/Upgrade a collector/);
});
test('Each resource goes only to its own collector; the headquarters takes Ore',()=>{
 const g=flat(),hq=g.entities.find(e=>e.type==='humans_b0');
 assert(g.acceptsResource(hq,0));for(const r of [1,2,3])assert(!g.acceptsResource(hq,r));
 const aether=node(g,2,14.5,8.5),w=g.spawnUnit('humans_u0',0,12,9);g.rebuildNav();g.updateVision();w.carry=12;w.carryType=2;g.order([w.id],{kind:'returnCargo'});run(g,3);
 assert.equal(w.carry,12,'Aetherite is not delivered to the headquarters');assert.match(w.blockReason,/Aetherite mine/);
 const c=g.spawnBuilding('humans_aetherwell',0,aether.x,aether.y,true);g.rebuildNav();g.updateVision();run(g,8);assert.equal(w.carry,0,'Delivered to the Aetherite collector');assert(g.acceptsResource(c,2)&&!g.acceptsResource(c,0));
 const ore=g.spawnUnit('humans_u0',0,10,11);ore.carry=10;ore.carryType=0;const before=g.players[0].stock[0];g.order([ore.id],{kind:'returnCargo'});run(g,6);assert.equal(g.players[0].stock[0],before+10);
});
test('A collector is upgraded in place into a deep mine after the research',()=>{
 const g=flat(),n=node(g,0,20.5,20.5,0),c=g.spawnBuilding('humans_orewell',0,n.x,n.y,true);g.rebuildNav();g.updateVision();
 assert(!g.queue(c.id,'humans_deepen_ore','extension').ok,'Needs Subsurface Extraction first');
 g.players[0].tech.push('humans_deep_extraction');const r=g.queue(c.id,'humans_deepen_ore','extension');assert(r.ok,r.reason);run(g,D.extensions.humans_deepen_ore.time+2);
 assert.equal(c.type,'humans_deep_ore');assert.equal(g.def(c).kind,'deepMine');assert.equal(c.x,n.x);assert(g.acceptsResource(c,0));assert(!c.extension);
});
test('At most three workers gather one deposit node; the rest move to nodes with room',()=>{
 const g=flat(),a=node(g,0,20.5,14.5),b=node(g,0,23.5,16.5),ws=[0,1,2,3,4].map(i=>g.spawnUnit('humans_u0',0,15+i*.4,12));g.rebuildNav();g.updateVision();
 g.order(ws.map(w=>w.id),{kind:'gather',target:a.id});run(g,4);
 const onA=ws.filter(w=>w.order?.target===a.id).length,onB=ws.filter(w=>w.order?.target===b.id).length;assert.equal(onA,3);assert.equal(onB,2);
 const extra=[0,1,2,3].map(i=>g.spawnUnit('humans_u0',0,17+i*.4,13));g.order(extra.map(w=>w.id),{kind:'gather',target:a.id});run(g,3);assert(extra.filter(w=>w.order?.target===b.id).length<=1);assert(extra.some(w=>/already has 3 workers/.test(w.blockReason||'')));
});
test('At most six miners work one deep mine',()=>{
 const g=flat(),n=node(g,0,20.5,20.5,0),c=g.spawnBuilding('humans_orewell',0,n.x,n.y,true);g.players[0].tech.push('humans_deep_extraction');g.queue(c.id,'humans_deepen_ore','extension');run(g,45);
 const ws=Array.from({length:8},(_,i)=>g.spawnUnit('humans_u0',0,16+i*.3,16));g.order(ws.map(w=>w.id),{kind:'extract',target:c.id});
 assert.equal(ws.filter(w=>w.order?.kind==='extract'&&w.order.target===c.id).length,6);
});
test('Only Ore can be gathered before its collector stands',()=>{
 const g=flat(),rift=node(g,3,22.5,12.5,220),ore=node(g,0,12.5,12.5),w=g.spawnUnit('humans_u0',0,20,12),v=g.spawnUnit('humans_u0',0,11,11);g.rebuildNav();g.updateVision();
 g.order([w.id],{kind:'gather',target:rift.id});g.order([v.id],{kind:'gather',target:ore.id});run(g,6);
 assert.equal(w.carry,0);assert.equal(rift.amount,220,'No Rift Crystals dug without an observatory');assert.match(w.blockReason,/Rift observatory first/);assert(g.players[0].gathered[0]>0||v.carry>0,'Ore needs no collector');
 g.spawnBuilding('humans_riftwell',0,rift.x,rift.y,true);g.rebuildNav();g.updateVision();run(g,10);assert(rift.amount<220,'Mining starts once the collector stands');
});
test('A deposit at a cliff edge still takes its collector, shifted off the edge, and stays mineable',()=>{
 const g=flat(),n=node(g,3,20.5,20.5);for(let y=0;y<48;y++)for(let x=21;x<48;x++)g.map[y*48+x].height=4;g.players.forEach(p=>g.map.forEach((t,i)=>{p.knownTiles[i]=t.height;}));g.rebuildNav();g.updateVision();
 const site=g.collectorSite('humans_riftwell',0,20.5,20.5);assert(site.x<20.5,'the footprint moves away from the cliff');assert(Math.abs(site.x-20.5)<=1&&Math.abs(site.y-20.5)<=1,'the deposit stays under the building');
 assert.equal(g.placement('humans_riftwell',0,20.5,20.5),null);
 const b=g.spawnBuilding('humans_riftwell',0,site.x,site.y,true),w=g.spawnUnit('humans_u0',0,16,16);g.rebuildNav();g.updateVision();g.order([w.id],{kind:'gather',target:n.id});run(g,25);
 assert(g.players[0].gathered[3]>0||w.carry>0,'a worker mines the deposit beside the shifted collector: '+(w.blockReason||w.action));
});
test('A collector upgrade needs no extension bay or land beside it',()=>{
 const g=flat(),n=node(g,0,20.5,20.5,0),c=g.spawnBuilding('humans_orewell',0,n.x,n.y,true);g.players[0].tech.push(...Object.keys(D.research).filter(id=>id.startsWith('humans_')));
 for(let x=21;x<26;x++)g.spawnBuilding('humans_b1',0,x+1.5,20.5,true);g.rebuildNav();
 const up=D.extensions.humans_deepen_ore;assert(up&&up.upgradeTo);const r=g.queue(c.id,up.id,'extension');assert(r.ok,r.reason);
});
console.log('TOTAL '+count+' collector checks passed');
