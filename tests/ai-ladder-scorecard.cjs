"use strict";
// Head-to-head scorecard: real, deterministic, side-swapped matches between two tiers.
// Records the full competence picture, not just the winner: resources gathered and spent,
// combat units actually spawned / surviving / killed, damage, buildings and tech.
// Unfinished games are never counted as wins. Starting units are not production.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),S=require('./ai-ladder-stats.cjs');
const source=path.resolve(process.env.AI_SOURCE||'src');
const D=require(path.join(source,'data.js')),{Game}=require(path.join(source,'simulation.js')),A=require(path.join(source,'ai.js'));
const out=process.env.AI_REPORT||'.art-work/ai-ladder-scorecard.json';
const matches=Number(process.env.AI_MATCHES||20);         // scheduled matches per pair (side-swapped); timeouts remain unresolved
const limit=Number(process.env.AI_SECONDS||1800);
const layouts=(process.env.AI_LAYOUTS||'natural,rivers,coastal,steppes,mountain-passes,continental,labyrinth,narrows').split(',');
const factions=(process.env.AI_FACTIONS||Object.keys(D.factions).join(',')).split(',');
const sizes=(process.env.AI_SIZES||'120,180').split(',').map(Number);
const seed0=Number(process.env.AI_SEED||4242);
const pairsArg=process.env.AI_PAIRS||'adjacent';
const pairs=pairsArg==='adjacent'?A.levels.slice(1).map((l,i)=>[l.level,l.level-1]):pairsArg.split(',').map(s=>s.split(':').map(Number));
for(const [hi,lo] of pairs)if(!(hi>=1&&hi<=10&&lo>=1&&lo<=10))throw Error('bad pair '+hi+':'+lo);
const hashes=Object.fromEntries(fs.readdirSync(source).filter(f=>f.endsWith('.js')).sort().map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(path.join(source,f))).digest('hex')]));
const settings={matches,limit,layouts,factions,sizes,seed0,pairs};
const runnerHash=crypto.createHash('sha256').update(fs.readFileSync(__filename)).digest('hex');
const fingerprint=crypto.createHash('sha256').update(JSON.stringify({settings,hashes,runnerHash})).digest('hex');
const report=fs.existsSync(out)?JSON.parse(fs.readFileSync(out,'utf8')):{fingerprint,settings,hashes,runnerHash,createdAt:new Date().toISOString(),cases:[]};
if(report.fingerprint!==fingerprint)throw Error('Report was produced with different settings or source; choose another AI_REPORT');

const specs=[];
for(const [high,low] of pairs)for(let m=0;m<matches;m++){
 const side=m%2, r=Math.floor(m/2);
 specs.push({high,low,side,match:m,
  seed:seed0+r*7919+high*131,
  layout:layouts[(r+high)%layouts.length],
  faction:factions[(r+high)%factions.length],
  size:sizes[r%sizes.length]});
}
function tally(){
 const summary=[];
 for(const [high,low] of pairs){
  const cs=report.cases.filter(c=>c.high===high&&c.low===low);
  const done=cs.filter(c=>c.winner==='higher'||c.winner==='lower');
  const hw=cs.filter(c=>c.winner==='higher').length, lw=cs.filter(c=>c.winner==='lower').length;
  const unresolved=cs.filter(c=>['draw','time-limit','error'].includes(c.winner));
  const avg=(sel,who)=>done.length?Math.round(done.reduce((n,c)=>n+c.score[who][sel],0)/done.length):null;
  summary.push({higherTier:A.levels[high-1].name,lowerTier:A.levels[low-1].name,
   completed:done.length,higherWins:hw,lowerWins:lw,
   higherWinRateOfCompleted:done.length?+(hw/done.length).toFixed(3):null,
   lowerWinRateOfCompleted:done.length?+(lw/done.length).toFixed(3):null,
   observedInBand:done.length?(lw/done.length>=.05&&lw/done.length<=.10):null,
   batchStatus:S.batchRange(lw,cs.length,unresolved.length),
   inTargetBand:S.batchRange(lw,cs.length,unresolved.length)==='within-5-to-10-percent',
   lowerWinRateOfAll:cs.length?lw/cs.length:null,
   lowerWinRateUpper95:S.upperBound(lw+unresolved.length,cs.length),
   unresolved:unresolved.length,timeouts:cs.filter(c=>c.winner==='time-limit').length,
   draws:cs.filter(c=>c.winner==='draw').length,errors:cs.filter(c=>c.winner==='error').length,
   avgMatchSeconds:done.length?Math.round(done.reduce((n,c)=>n+c.seconds,0)/done.length):null,
   higherStats:{gathered:avg('gathered','higher'),spent:avg('spent','higher'),produced:avg('militaryProduced','higher'),surviving:avg('militarySurviving','higher'),kills:avg('kills','higher'),lost:avg('militaryLost','higher'),damage:avg('damage','higher')},
   lowerStats:{gathered:avg('gathered','lower'),spent:avg('spent','lower'),produced:avg('militaryProduced','lower'),surviving:avg('militarySurviving','lower'),kills:avg('kills','lower'),lost:avg('militaryLost','lower'),damage:avg('damage','lower')}});
 }
 report.summary=summary;report.completed=report.cases.length;report.planned=specs.length;report.finishedAt=new Date().toISOString();
 fs.mkdirSync(path.dirname(out),{recursive:true});
 fs.writeFileSync(out+'.tmp',JSON.stringify(report,null,2));fs.renameSync(out+'.tmp',out);
}
tally();
for(const spec of specs){
 const key=JSON.stringify(spec);if(report.cases.some(c=>c.key===key))continue;
 const started=Date.now();
 const g=new Game({size:spec.size,seed:spec.seed,layout:spec.layout,factions:[spec.faction,spec.faction],resourcePlacement:'balanced',startingResources:true});
 g.players.forEach((pl,i)=>{pl.ai=true;pl.aiDifficulty=A.levels[(i===spec.side?spec.high:spec.low)-1].id;});
 const dealt=[0,0],paid=[0,0],produced=[0,0],lost=[0,0],damage=g.damage,pay=g.pay,spawn=g.spawnUnit;
 const military=e=>{const d=D.units[e.type];return e.kind==='unit'&&d?.damage>0&&!d.worker&&!d.transport&&!['merchant','navalMerchant'].includes(d.role);};
 g.spawnUnit=function(...args){const u=spawn.apply(this,args);if(military(u)&&u.owner<2)produced[u.owner]++;return u;};
 g.damage=function(e,n,u){const before=e.hp,r=damage.call(this,e,n,u);if(u?.owner!==undefined&&this.hostile(u.owner,e.owner))dealt[u.owner]+=Math.max(0,before-Math.max(0,e.hp));if(before>0&&e.hp<=0&&military(e)&&e.owner<2)lost[e.owner]++;return r;};
 g.pay=function(o,c){const ok=pay.call(this,o,c);if(ok)paid[o]+=c.reduce((a,b)=>a+b,0);return ok;};
 let failure=null;
 for(let i=0;i<limit/.15&&g.winner===null;i++){try{g.tick(.15);}catch(e){failure={message:e.message,stack:(e.stack||'').split('\n').slice(0,5).join(' | ')};break;}}
 const winner=failure?'error':g.winner===null?'time-limit':g.winner===-1?'draw':g.winner===spec.side?'higher':'lower';
 const per=i=>{const pl=g.players[i],mine=g.entities.filter(e=>e.owner===i&&e.hp>0);
  const surv=mine.filter(military).length;
  const workers=mine.filter(e=>e.kind==='unit'&&D.units[e.type].worker).length;
  return {gathered:Math.round(pl.gathered.reduce((a,b)=>a+b,0)),gatheredByResource:pl.gathered.map(Math.round),
   spent:Math.round(paid[i]),kills:pl.kills,lost:pl.lost,damage:Math.round(dealt[i]),
   militarySurviving:surv,workersSurviving:workers,militaryProduced:produced[i],militaryLost:lost[i],
   buildings:mine.filter(e=>e.kind==='building'&&e.progress>=1).length,tech:pl.tech.length,
   difficulty:pl.aiDifficulty};};
 const hi=spec.side,lo=1-spec.side;
 const row={...spec,key,winner,...(failure?{error:failure}:{}),seconds:Math.round(g.time),
  wallSeconds:Math.round((Date.now()-started)/1000),score:{higher:per(hi),lower:per(lo)}};
 report.cases.push(row);tally();
 if(winner==='time-limit'||winner==='error'){const dir=out.replace(/\.json$/,'')+'-failures';fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,`${spec.high}-${spec.low}-${spec.match}.json`),g.serialize());}
 console.log(`${A.levels[spec.high-1].name}/${A.levels[spec.low-1].name} m${spec.match} side${spec.side} ${spec.layout}/${spec.faction}/${spec.size} -> ${winner.toUpperCase()} ${row.seconds}s (wall ${row.wallSeconds}s) | hi gath=${row.score.higher.gathered} mil=${row.score.higher.militarySurviving} kills=${row.score.higher.kills} lost=${row.score.higher.militaryLost} | lo gath=${row.score.lower.gathered} mil=${row.score.lower.militarySurviving} kills=${row.score.lower.kills} lost=${row.score.lower.militaryLost}`);
}
for(const s of report.summary)console.log(`${s.higherTier}/${s.lowerTier}: completed=${s.completed} higher=${s.higherWins} lower=${s.lowerWins} lowerRate=${s.lowerWinRateOfCompleted} inBand=${s.inTargetBand} unresolved=${s.unresolved}`);
if(report.cases.some(c=>c.winner==='error'))process.exitCode=1;
