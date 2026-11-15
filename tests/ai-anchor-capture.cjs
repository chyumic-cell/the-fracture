"use strict";
// Run in separate processes to isolate globals/module state between baseline and candidate.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),root=path.resolve(process.env.AI_SOURCE||'src'),A=require(path.join(root,'ai.js')),{Game}=require(path.join(root,'simulation.js'));
// Exclude only new monitoring bookkeeping; all gameplay state, RNG and orders
// are still compared against the original complete-game checkpoint hashes.
function checkpoint(g){const saved=g.players.map(p=>p.aiState?.recovery);try{for(const p of g.players)if(p.aiState)delete p.aiState.recovery;return crypto.createHash('sha256').update(g.serialize()).digest('hex');}finally{g.players.forEach((p,i)=>{if(saved[i])p.aiState.recovery=saved[i];});}}
const anchor=process.env.AI_ANCHOR||'relaxed';
const cases=[{faction:'humans',layout:'natural',seed:42,seconds:300},{faction:'primates',layout:'small-islands',seed:213301,seconds:300},{faction:'machines',layout:'narrows',seed:836651,seconds:180}];
const report={anchor,profile:A.configFor(anchor),cases:[]};
for(const spec of cases){const g=new Game({size:100,seed:spec.seed,layout:spec.layout,factions:[spec.faction,spec.faction],difficulty:anchor});g.players.forEach(p=>{p.ai=true;p.aiDifficulty=anchor;});const checkpoints=[];for(let i=0;i<spec.seconds/.15;i++){g.tick(.15);if(i%400===399)checkpoints.push(checkpoint(g));}report.cases.push({...spec,checkpoints});console.log('CAPTURE '+JSON.stringify(spec));}
const out=process.env.AI_ANCHOR_OUTPUT||'.art-work/ai-anchor-candidate.json';fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2));
if(process.env.AI_ANCHOR_COMPARE){require('node:assert/strict').deepEqual(report,JSON.parse(fs.readFileSync(process.env.AI_ANCHOR_COMPARE,'utf8')));console.log('PASS '+anchor+' profile and gameplay checkpoints unchanged (new recovery monitoring excluded)');}
