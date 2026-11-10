'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),{Game}=require('../src/simulation.js');
const results=[],begin=Date.now();
for(const faction of ['humans','symbiotes'])for(const topSide of [0,1]){
 const g=new Game({size:48,seed:faction==='humans'?42:213301,factions:[faction,faction],difficulty:'expert'});
 g.players.forEach((p,i)=>{p.ai=true;p.aiDifficulty=i===topSide?'apocalypse':'expert';});
 const dealt=[0,0],damage=g.damage;g.damage=function(t,n,s){const before=t.hp;const result=damage.call(this,t,n,s);if(s?.owner!==undefined&&this.hostile(s.owner,t.owner))dealt[s.owner]+=Math.max(0,before-Math.max(0,t.hp));return result;};
 for(let tick=0;tick<7200&&g.winner===null;tick++){g.tick(.1);if(tick%1200===1199)console.log(JSON.stringify({faction,topSide,time:Math.round(g.time),damage:dealt.map(Math.round)}));}
 const result={faction,topSide,seconds:Math.round(g.time),winner:g.winner===null?'time-limit':g.winner===topSide?'apocalypse':'expert',players:g.players.map(p=>({difficulty:p.aiDifficulty,kills:p.kills,lost:p.lost,damage:Math.round(dealt[p.id]),gathered:p.gathered.map(Math.round),tech:p.tech.length,workers:g.entities.filter(e=>e.hp>0&&e.owner===p.id&&e.kind==='unit'&&g.def(e).worker).length}))};
 assert(g.players.every(p=>p.stock.every(v=>Number.isFinite(v)&&v>=0)));results.push(result);fs.writeFileSync('docs/ai-difficulty-results.json',JSON.stringify({scope:'Four side-swapped mirror matches, two factions and seeds, Apocalypse versus Expert. Every difficulty uses equal gathering, production, costs, damage and private-fog rules; differences are decisions only. Bounded comparison, not a guarantee against humans.',results,wallMs:Date.now()-begin},null,2));console.log('MATCH '+JSON.stringify(result));
}
console.log('FINISHED '+results.filter(x=>x.winner==='apocalypse').length+'/'+results.length+' Apocalypse wins');
