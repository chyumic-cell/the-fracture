'use strict';
// Technology tree rules for every civilization: research that unlocks units is done in the building
// that trains them, every production building can train something at once, and every building with a
// technology panel has research. The new upgrade kinds have real effects.
const assert=require('node:assert/strict'),D=require('../src/data.js'),{Game}=require('../src/simulation.js');
let checks=0;const skip=new Set(['extractor','deepMine','wall','trap','depot']);
assert.equal(Object.keys(D.factions).length,12);
for(const f of Object.values(D.factions)){
 for(const b of f.buildings){if(skip.has(b.kind))continue;
  const units=f.units.filter(u=>u.building===b.id),research=f.research.filter(r=>r.building===b.id);
  assert(research.length>0,`${f.id}: ${b.name} has nothing to research`);
  if(units.length)assert(units.some(u=>!u.requires.some(r=>D.research[r])),`${f.id}: ${b.name} cannot train anything without research`);
  for(const u of units)for(const r of u.requires){assert(D.research[r]||D.buildings[r],`${u.id} has an unknown requirement ${r}`);if(D.research[r])assert.equal(D.research[r].building,b.id,`${u.name} needs ${D.research[r].name} from another building`);}
  for(const r of research.filter(r=>r.kind==='doctrine'))for(const q of r.requires)assert.equal(D.research[q].building,b.id,`${r.name} needs research from another building`);
  checks++;
 }
 const names=f.research.map(r=>r.name);assert.equal(new Set(names).size,names.length,f.id+' has two technologies with the same name');
}
// Effects.
const g=new Game({size:48,seed:3,factions:['humans','machines']});g.players.forEach(p=>{p.ai=false;});const p=g.players[0];
const houses=()=>g.capacity(0);const before=houses();g.spawnBuilding('humans_b1',0,20,20,true);const withHouse=houses();assert.equal(withHouse-before,12);p.tech.push('humans_b1_specialization');assert.equal(houses()-before,16,'Expanded Quarters adds population per house');
const tower=g.spawnBuilding('humans_b7',0,24,20,true),base=g.range(tower);p.tech.push('humans_b7_specialization');assert(Math.abs(g.range(tower)-base*1.2)<1e-9,'Reinforced Emplacements extends tower range');
g.spawnBuilding('humans_market',0,28,20,true);const plain=g.sellPrice(0,0);p.tech.push('humans_market_specialization');assert(g.sellPrice(0,0)>plain,'Trade Contracts improve sales');assert.equal(g.sellPrice(0,1),plain,'only for the researching player');
assert(g.hasResearchKind(0,'housing')&&!g.hasResearchKind(1,'housing'));
console.log('PASS tech tree: '+checks+' buildings across 12 civilizations follow the rules; housing, tower range and trade upgrades take effect');
