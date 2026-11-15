"use strict";
// Seeded sampling without replacement: every gap pair is visited before repeats.
function crossTierSpecs(settings){
 const count=settings.crossChecks,seed=settings.crossSeed;
 if(!Number.isInteger(count)||count<1||!Number.isInteger(seed))throw Error('Invalid cross-tier sampling settings');
 let state=seed>>>0;const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
 const take=a=>a[Math.floor(random()*a.length)],specs=[];let pairs=[];
 for(let i=0;i<count;i++){
  if(!pairs.length){for(let high=4;high<=10;high++)for(let low=2;low<high-1;low++)pairs.push({high,low});for(let j=pairs.length-1;j>0;j--){const k=Math.floor(random()*(j+1));[pairs[j],pairs[k]]=[pairs[k],pairs[j]];}}
  const {high,low}=pairs.pop(),faction=take(settings.factions),opponentFaction=take(settings.factions),layout=take(settings.layouts),size=take(settings.sizes),mapSeed=Math.floor(random()*2147483646)+1;
  const varied=settings.varyConditions,playerCount=varied?take([2,3,4]):2;
  const conditions=varied?{resourceAmount:take([.5,1,2,4]),placement:take(['balanced','random','contested']),startingResources:take([true,false]),extraPlayers:Array.from({length:playerCount-2},()=>({faction:take(settings.factions),level:2+Math.floor(random()*9)}))}:{};
  for(const side of [0,1])specs.push({seed:mapSeed,faction,opponentFaction,layout,size,high,low,gap:high-low,side,...conditions});
 }
 return specs;
}
// Adjacent calibration stays one-on-one: extra opponents would confound the
// requested lower-versus-higher win rate. Economic conditions still vary.
function varyDuelConditions(specs,seed){
 let state=seed>>>0;const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;},take=a=>a[Math.floor(random()*a.length)],conditions=new Map();
 return specs.map(spec=>{const {side,...pair}=spec,key=JSON.stringify(pair);if(!conditions.has(key))conditions.set(key,{resourceAmount:take([.5,1,2,4]),placement:take(['balanced','random','contested']),startingResources:take([true,false])});return {...spec,...conditions.get(key)};});
}
// Keep each side-swapped pair together; periodically insert an independent
// nonadjacent matchup so the ladder does not only learn its immediate neighbor.
function interleaveSpecs(adjacent,checks,every){
 if(!Number.isInteger(every)||every<0||adjacent.length%2||checks.length%2)throw Error('Invalid paired screening schedule');
 if(!every)return [...adjacent];const result=[];let next=0;
 for(let i=0;i<adjacent.length;i+=2){result.push(...adjacent.slice(i,i+2));if((i/2+1)%every===0&&next<checks.length){result.push(...checks.slice(next,next+2));next+=2;}}
 return result;
}
module.exports={crossTierSpecs,varyDuelConditions,interleaveSpecs};
