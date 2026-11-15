const assert=require('node:assert/strict'),{crossTierSpecs}=require('./ai-cross-tier-schedule.cjs');
const settings={crossChecks:28,crossSeed:90210,factions:['humans','machines','wizards','primates'],layouts:['natural','small-islands','narrows','rivers'],sizes:[100,200]};
const cases=crossTierSpecs(settings);assert.deepEqual(cases,crossTierSpecs(settings));assert.equal(cases.length,56);assert.equal(new Set(cases.map(c=>c.high+':'+c.low)).size,28);
for(let i=0;i<cases.length;i+=2){const a=cases[i],b=cases[i+1];assert.deepEqual({...a,side:1},b);assert(a.high-a.low>=2&&a.low>=2);assert(settings.layouts.includes(a.layout));assert(settings.sizes.includes(a.size));}
assert(new Set(cases.map(c=>c.layout)).size===4);assert(cases.some(c=>c.faction!==c.opponentFaction));assert.notDeepEqual(cases,crossTierSpecs({...settings,crossSeed:123}));
console.log('PASS reproducible random nonadjacent pairs, terrain/faction variation, side swaps, and complete pair coverage');

const varied=crossTierSpecs({...settings,varyConditions:true});assert.equal(new Set(varied.map(c=>c.resourceAmount)).size,4);assert.equal(new Set(varied.map(c=>c.placement)).size,3);assert.equal(new Set(varied.map(c=>c.startingResources)).size,2);assert.equal(new Set(varied.map(c=>c.extraPlayers.length)).size,3);
for(let i=0;i<varied.length;i+=2)assert.deepEqual({...varied[i],side:1},varied[i+1]);
console.log('PASS varied abundance, starting deposits, placement and two-to-four players retain paired reproducibility');

const {varyDuelConditions}=require('./ai-cross-tier-schedule.cjs'),duels=cases.map(c=>({...c,high:c.low+1,gap:1})),variedDuels=varyDuelConditions(duels,811);
assert.deepEqual(variedDuels,varyDuelConditions(duels,811));assert.notDeepEqual(variedDuels,varyDuelConditions(duels,812));
assert.equal(new Set(variedDuels.map(c=>c.resourceAmount)).size,4);assert.equal(new Set(variedDuels.map(c=>c.placement)).size,3);assert.equal(new Set(variedDuels.map(c=>c.startingResources)).size,2);
for(let i=0;i<variedDuels.length;i+=2){assert.deepEqual({...variedDuels[i],side:1},variedDuels[i+1]);assert(!variedDuels[i].extraPlayers);}
console.log('PASS adjacent matches vary economic conditions with identical side-swapped settings and no extra opponents');

const {interleaveSpecs}=require('./ai-cross-tier-schedule.cjs'),neighbors=variedDuels.slice(0,16),checks=varied.slice(0,4),mixed=interleaveSpecs(neighbors,checks,4);
assert.equal(mixed.length,20);assert.deepEqual(mixed.slice(0,8),neighbors.slice(0,8));assert.deepEqual(mixed.slice(8,10),checks.slice(0,2));assert.deepEqual(mixed.slice(10,18),neighbors.slice(8));assert.deepEqual(mixed.slice(18),checks.slice(2));assert.deepEqual(interleaveSpecs(neighbors,checks,0),neighbors);assert.throws(()=>interleaveSpecs(neighbors,checks,1.5));
console.log('PASS periodic cross-tier games preserve complete adjacent pairs and remain independently reportable');
