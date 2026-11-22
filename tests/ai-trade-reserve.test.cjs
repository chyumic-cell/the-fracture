'use strict';
const assert=require('node:assert/strict'),D=require('../src/data'),{Game}=require('../src/simulation'),A=require('../src/ai'),E=require('../src/ai-economy');
for(const f of Object.values(D.factions)){
 const g=new Game({size:64,seed:42,factions:[f.id,f.id],difficulty:'apocalypse'});g.entities=[];g.players.forEach(p=>p.ai=false);g.map.forEach(t=>Object.assign(t,{height:0,water:false}));
 const p=g.players[0];p.home={x:10,y:10};p.stock=[5000,1000,1000,0];p.aiRenewableTargets=[0];p.knowledge={};
 g.spawnBuilding(f.buildings.find(b=>b.kind==='hq').id,0,10,10,true);const inf=g.spawnBuilding(f.buildings.find(b=>b.kind==='inf').id,0,18,10,true);g.spawnBuilding(f.id+'_market',0,10,25,true);
 for(let i=0;i<4;i++)g.spawnBuilding(f.buildings.find(b=>b.kind==='house').id,0,8+i*6,45,true);
 for(let i=0;i<8;i++)g.spawnUnit(f.units.find(u=>u.worker).id,0,14+i*.3,15);
 g.time=500;g.rebuildNav();g.updateVision();p.explored.fill(1);p.knownNav.set(g.nav);p.knownTiles.fill(0);
 const context=A.context(g,p),plan=E.sustainability(g,p,context);assert(plan.tradeFirst,f.id+' missing recovery precondition');
 const before=[...p.stock];E.step(g,p,context);
 assert(inf.queue.some(q=>D.units[q.type]?.damage>0),f.id+' locked all combat production behind a missing rare resource');
 for(let r=0;r<4;r++)if(p.stock[r]<before[r])assert(p.stock[r]>=plan.cost[r],f.id+' consumed protected recovery funds');
 const cheap=f.units.find(u=>u.building===inf.type&&u.damage>0&&u.cost.slice(1).every(v=>v===0));
 if(cheap){p.stock=[plan.cost[0]+cheap.cost[0]-1,0,0,0];assert(!E.protectedSpend(p,cheap),'Do not unlock unfunded discretionary spending');}
}
console.log('PASS all twelve civilizations can recruit from surplus while preserving the full trading/drilling reserve');
