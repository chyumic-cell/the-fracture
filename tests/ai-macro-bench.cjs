"use strict";
// Solo development benchmark: measures each tier's own economic and production competence
// with no opponent interference. Real game rules, real costs, real deposits, no combat.
// Purpose: expose tiers whose "stronger" configuration produces a WEAKER economy.
const fs=require('fs'),path=require('path');
const source=path.resolve(process.env.AI_SOURCE||'src');
const D=require(path.join(source,'data.js')),{Game}=require(path.join(source,'simulation.js')),A=require(path.join(source,'ai.js'));
const out=process.env.AI_REPORT||'.art-work/ai-macro-bench.json';
const tiers=(process.env.AI_TIERS||A.levels.map(l=>l.id).join(',')).split(',');
const seconds=Number(process.env.AI_SECONDS||600);
const seeds=(process.env.AI_SEEDS||'42').split(',').map(Number);
const faction=process.env.AI_FACTION||'humans';
const layout=process.env.AI_LAYOUT||'natural';
const size=Number(process.env.AI_SIZE||120);
const rows=[];
for(const seed of seeds)for(const tier of tiers){
 const started=Date.now();
 const g=new Game({size,seed,layout,factions:[faction,faction],resourceAmount:Number(process.env.AI_AMOUNT||1),resourcePlacement:process.env.AI_PLACEMENT||'balanced',startingResources:true});
 const slot=Number(process.env.AI_SLOT||0);
 g.players.forEach((pl,i)=>{pl.ai=(i===slot);if(i===slot)pl.aiDifficulty=tier;});
 let paid=0;const pay=g.pay;g.pay=function(o,c){const ok=pay.call(this,o,c);if(ok&&o===slot)paid+=c.reduce((a,b)=>a+b,0);return ok;};
 let err=null;
 for(let i=0;i<seconds/.15&&g.winner===null;i++){try{g.tick(.15);}catch(e){err={message:e.message,stack:(e.stack||'').split('\n').slice(0,4).join(' | ')};break;}}
 const p=g.players[slot];
 const mine=g.entities.filter(e=>e.owner===slot&&e.hp>0);
 const units=mine.filter(e=>e.kind==='unit'),builds=mine.filter(e=>e.kind==='building'&&e.progress>=1);
 const workers=units.filter(u=>D.units[u.type].worker).length;
 const military=units.filter(u=>!D.units[u.type].worker).length;
 const kinds={};for(const b of builds){const k=D.buildings[b.type].kind;kinds[k]=(kinds[k]||0)+1;}
 const prod=['inf','armor','air','elite','counter'].reduce((n,k)=>n+(kinds[k]||0),0);
 rows.push({tier,slot,level:A.configFor(tier).level,seed,error:err,
  workers,military,buildings:builds.length,productionBuildings:prod,kinds,
  gathered:p.gathered.map(Math.round),gatheredTotal:Math.round(p.gathered.reduce((a,b)=>a+b,0)),
  banked:p.stock.map(Math.round),bankedTotal:Math.round(p.stock.reduce((a,b)=>a+b,0)),
  paid:Math.round(paid),tech:p.tech.length,
  decisions:p.aiState?.metrics?.decisions??null,targetChanges:p.aiState?.metrics?.targetChanges??null,
  simSeconds:Math.round(g.time),wallSeconds:Math.round((Date.now()-started)/1000)});
 const r=rows[rows.length-1];
 console.log(`${String(r.level).padStart(2)} ${r.tier.padEnd(12)} seed${seed} workers=${String(r.workers).padStart(3)} mil=${String(r.military).padStart(3)} prodBldg=${r.productionBuildings} bldg=${String(r.buildings).padStart(2)} gathered=${String(r.gatheredTotal).padStart(6)} spent=${String(r.paid).padStart(6)} banked=${String(r.bankedTotal).padStart(5)} tech=${r.tech} decisions=${r.decisions} ${r.error?'ERROR '+r.error.message:''}`);
}
fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,JSON.stringify({settings:{tiers,seconds,seeds,faction,layout,size},rows},null,2));
if(rows.some(r=>r.error))process.exitCode=1;
