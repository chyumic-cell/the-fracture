"use strict";
const assert=require('node:assert/strict'),{Game}=require('../src/simulation'),A=require('../src/ai'),L=require('../src/ai-logistics'),E=require('../src/ai-economy');
const g=new Game({size:100,layout:'small-islands',seed:1,difficulty:'apocalypse',startingResources:false,factions:['humans','humans']});g.entities=[];for(let y=0;y<100;y++)for(let x=0;x<100;x++){g.tile(x,y).height=0;g.tile(x,y).water=x>=30&&x<61;}
g.players.forEach(p=>{p.ai=false;p.knowledge={};p.stock=[20,25,60,10];});const p=g.players[0];p.home={x:18,y:30};g.spawnBuilding('humans_b0',0,18,30,true);g.spawnBuilding('humans_b0',1,90,90,true);g.spawnBuilding('humans_dock',0,29,30,true);for(let i=0;i<5;i++)g.spawnUnit('humans_u0',0,23+i*.3,30);g.spawnUnit('humans_transport_ship',0,32,30);
const node=g.add({kind:'resource',resource:0,x:66,y:30,hp:1,amount:2500,maxAmount:2500,size:.85});g.rebuildNav();g.updateVision();p.explored.fill(1);p.visible.fill(1);p.knownNav.set(g.nav);p.knownTiles.set(g.map.map(t=>(t.water?128:0)|t.height));p.knowledge[node.id]={...node};g.time=150;p.aiLogistics={next:0,nextExpansion:0};p.aiSustainability={cost:[0,0,0,0],ids:[],remaining:[0,0,0,0],relocation:true};
let ferry=false,landed=false,carried=false;for(let i=0;i<12000&&p.gathered[0]<30;i++){if(i%10===0)L.step(g,p,A.context(g,p));ferry||=!!p.aiLogistics.expansion?.ferry;g.tick(.1);landed||=g.entities.some(u=>u.owner===0&&g.def(u)?.worker&&!u.embarkedBy&&u.x>61);carried||=g.entities.some(u=>u.owner===0&&u.embarkedBy&&u.carry>0);}
assert(ferry,'plan an affordable cargo ferry instead of requiring an unaffordable depot');assert(landed);assert(carried,'carried Ore physically crossed the sea');assert(p.gathered[0]>=30,'ferried cargo was delivered through normal collection rules');assert(node.amount<2500);assert(p.stock[0]<=20+p.gathered[0]);
console.log('PASS actual workers ferry finite Ore home across water before an outpost is affordable');
for(const faction of Object.keys(require('../src/data').factions)){
 const h=new Game({size:100,seed:1,layout:'small-islands',startingResources:false,difficulty:'apocalypse',factions:[faction,faction]}),q=h.players[0];h.entities=h.entities.filter(e=>e.kind!=='resource');q.knowledge={};q.explored.fill(0);h.updateVision();h.time=61;const plan=E.sustainability(h,q,A.context(h,q));assert(plan.bootstrap);assert.equal(plan.cost[0],300);assert(!E.protectedSpend(q,require('../src/data').factions[faction].buildings.find(b=>b.kind==='inf')));
}
console.log('PASS all twelve civilizations preserve a normal-priced dock and transport opening on resource-free islands');

{
 const party=g.entities.filter(u=>u.owner===0&&g.def(u)?.worker).slice(0,2),ship=g.entities.find(u=>u.type==='humans_transport_ship');
 for(const [i,w]of party.entries()){w.x=63.5;w.y=32+i*.4;w.carry=12;w.carryType=0;w.order=null;w.path=[];w.aiLogistics=false;delete w.embarkedBy;}
 ship.x=60.5;ship.y=32.5;ship.order=null;ship.path=[];p.stock=[20,25,60,10];p.aiLogistics={next:0,nextExpansion:100000,nextSortie:100000};p.aiSustainability={cost:[65,0,0,0],ids:['humans_orewell'],remaining:[2000,0,0,0],relocation:false};g.rebuildNav();g.updateVision();p.explored.fill(1);p.knownNav.set(g.nav);const before=p.gathered[0];let rescue=false,aboard=false;
 for(let i=0;i<5000&&p.gathered[0]<before+24;i++){if(i%10===0)L.step(g,p,A.context(g,p));rescue||=!!p.aiLogistics.expansion?.rescue;g.tick(.1);aboard||=party.some(w=>w.embarkedBy);}
 assert(rescue,'expired ferry crew must be recovered');assert(aboard,'recovery must physically board a transport');assert(p.gathered[0]>=before+24,'cargo must be banked at a real collection point');assert(p.stock[0]<=20+p.gathered[0]-before);
}
console.log('PASS an expired ferry recovers stranded workers and physically banks existing cargo');
