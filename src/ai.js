'use strict';
// Shared strategic perception. All plans use the same private fog knowledge as a player.
(function(root){
const D=root.FD||(typeof require!=='undefined'?require('./data.js'):null),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
// Ordered from a forgiving learning opponent to the strongest challenge controller.
const levels=[
 ['gentle','Gentle',4,7,16,12,1.85,35,1,1.8,1],
 ['relaxed','Relaxed',3.2,9,24,11,1.6,40,1,1.5,1],
 ['easy','Easy',2.4,10,32,9,1.4,45,1,1.25,2],
 ['standard','Standard',1.6,14,56,8,1.15,85,1,1,2],
 ['challenging','Challenging',1.2,16,66,8,1.13,100,1,.95,2],
 ['veteran','Veteran',1,18,76,7,1.1,110,2,.9,2],
 ['expert','Expert',.8,20,88,7,1.08,120,2,.85,2],
 ['master','Master',.6,24,104,7,1.05,140,2,.9,3],
 ['nightmare','Nightmare',.45,28,120,6,1.03,160,3,.85,3],
 ['apocalypse','Apocalypse',.3,32,136,6,1.0,180,3,.8,4]
].map(([id,name,think,workerTarget,maxMilitary,minAttack,attackRatio,memory,scouts,techPace,productionLimit],index)=>{
 const level=index+1;return Object.freeze({id,name,level,think,workerTarget,maxMilitary,minAttack,attackRatio,memory,scouts,techPace,productionLimit:level>=9?level-3:productionLimit,
  economyRates:Object.freeze({gather:1,production:1}),
  adaptiveEconomy:level>=5,forecastFire:level>=7,screenArtillery:level>=8,domainMicro:level>=6,
  investmentBuffer:level>=5?1+(level-5)*.16:0,
  tacticalInterval:Math.max(.3,2.4-(level-4)*.35),
  counterWeight:Math.max(0,(level-3)/7),constructionCrew:level>=9?3:level>=6?2:1,
  focusFire:level>=4,kite:level>=4,abilities:level>=4,flank:level>=6,splashFocus:level>=8,
  retreatRatio:level<=3?1.55:level<=5?1.4:level<=7?1.28:1.2,
  withdrawHealth:level>=8?.3:.24,regroupDelay:Math.max(10,34-level*2),attackDelay:Math.max(10,48-level*4),
  assembleTime:level>=8?12:20,reinforceDelay:level>=8?10:18,reinforceMinimum:level>=8?4:5,reinforceReserve:level>=8?1:2,
  flankFraction:level>=8?.32:.25,flankLimit:level>=8?8:5});
});
const configs=Object.fromEntries(levels.map(c=>[c.id,c]));
// Original save IDs remain valid; only the ten named levels appear in setup.
function configFor(value){return configs[value==='normal'?'standard':value==='hard'?'expert':value]||configs.standard;}
function configuration(g,p){return configFor(p?.aiDifficulty||g.options.difficulty);}

function state(p){if(!p.aiState)p.aiState={};const s=p.aiState;s.contacts=s.contacts||{};s.scoutVisited=s.scoutVisited||{};s.metrics=s.metrics||{decisions:0,observations:0,scoutOrders:0,targetChanges:0};return s;}
function observe(g,p,enemy,config){const s=state(p),seen=new Set();for(const e of enemy){seen.add(e.id);if(!s.contacts[e.id])s.metrics.observations++;s.contacts[e.id]={id:e.id,kind:e.kind,type:e.type,owner:e.owner,x:e.x,y:e.y,hp:e.hp,maxHp:e.maxHp,size:e.size||0,seenAt:g.time};}
 for(const [id,e]of Object.entries(s.contacts))if(!seen.has(Number(id))&&(g.time-e.seenAt>config.memory||g.visible(p.id,e)))delete s.contacts[id];return Object.values(s.contacts);
}
function targetList(g,p,ctx){const s=state(p),byId=new Map();for(const e of Object.values(p.knowledge||{}))if(e.kind==='building'&&e.hp>0&&g.hostile(p.id,e.owner))byId.set(e.id,{...e});for(const e of ctx.enemy)if(e.kind==='building')byId.set(e.id,{...e});
 const force=ctx.military.filter(u=>!u.aiScoutUntil||u.aiScoutUntil<g.time),anchor=force.length?{x:force.reduce((n,u)=>n+u.x,0)/force.length,y:force.reduce((n,u)=>n+u.y,0)/force.length}:p.home,values={hq:100,inf:82,armor:90,air:90,elite:95,lab:65,counter:62,extractor:70,depot:65,house:40,defense:25};
 const targets=[...byId.values()].map(e=>{const d=D.buildings[e.type],guard=ctx.knownEnemies.reduce((n,v)=>{if(v.id===e.id||dist(v,e)>10)return n;const vd=v.kind==='unit'?D.units[v.type]:D.buildings[v.type],fresh=Math.max(.15,1-(g.time-v.seenAt)/ctx.config.memory);return n+fresh*(vd.kind==='defense'?25:vd.damage>0?Math.min(20,Math.sqrt(v.hp)*vd.damage/(vd.cooldown||1.25)/55):0);},0);return{...e,score:(values[d.kind]||45)+(g.time>360&&['hq','inf','armor','air','elite'].includes(d.kind)?45:0)-dist(anchor,e)*1.25-guard+(e.hp<e.maxHp*.4?18:0),guard};});targets.sort((a,b)=>b.score-a.score||a.id-b.id);
 // Penalize remembered unreachable strongholds, without inspecting unrevealed ground.
 if(g.time>=(s.routeReviewAt||0)){s.routeReviewAt=g.time+8;s.routePenalty={};const probe=force.find(u=>!D.units[u.type].air&&!D.units[u.type].naval&&!u.embarkedBy)||ctx.workers[0];if(probe)for(const t of targets.slice(0,4)){const dest=g.approach(probe,t,1),route=g.path(probe,dest),end=route.at(-1)||probe;if(dist(end,dest)>3)s.routePenalty[t.id]=90;}}
 for(const t of targets)t.score-=s.routePenalty?.[t.id]||0;targets.sort((a,b)=>b.score-a.score||a.id-b.id);return targets;
}
function explorationGoal(g,p,u,ctx){const s=state(p),n=g.n,radius=Math.min(10,D.units[u.type].vision||8);let best=null,score=-Infinity;
 for(let y=2;y<n-2;y+=3)for(let x=2;x<n-2;x+=3){const q={x:x+.5,y:y+.5},i=y*n+x;if(g.blocked(q.x,q.y,!!D.units[u.type].air,p.id))continue;const key=x+':'+y;if((s.scoutVisited[key]||0)>g.time)continue;let gain=0,edge=false;for(let dy=-6;dy<=6;dy+=3)for(let dx=-6;dx<=6;dx+=3){const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=n||yy>=n||Math.hypot(dx,dy)>radius)continue;if(!p.explored[yy*n+xx])gain++;else edge=true;}if(!gain||!edge)continue;
 const danger=ctx.enemy.reduce((a,e)=>{const d=g.def(e);return a+(d.damage>0||d.kind==='defense'?Math.max(0,12-dist(q,e))*5:0);},0),separation=ctx.military.some(v=>v.id!==u.id&&v.aiScoutUntil>g.time&&v.aiScoutGoal&&dist(v.aiScoutGoal,q)<9)?25:0,travel=dist(u,q),value=gain*2.5-travel*.65-danger-separation+(p.explored[i]?0:2);
 if(value>score){score=value;best={...q,key};}}
 if(!best){for(const t of ctx.targets){const angle=Math.atan2(u.y-t.y,u.x-t.x),q={x:t.x+Math.cos(angle)*9,y:t.y+Math.sin(angle)*9},key='watch:'+t.id;if((s.scoutVisited[key]||0)>g.time||g.blocked(q.x,q.y,!!D.units[u.type].air,p.id))continue;best={...q,key};break;}}return best;
}
function scout(g,p,ctx){const s=state(p),candidates=ctx.military.filter(u=>D.units[u.type].role==='scout'&&u.hp>u.maxHp*.45&&!u.returning&&!(u.aiWithdrawUntil>g.time)).sort((a,b)=>D.units[b.type].speed-D.units[a.type].speed||a.id-b.id),stealth=ctx.knownEnemies.some(e=>D.units[e.type]?.stealth);let count=Math.min(ctx.config.scouts,Math.max(1,Math.floor(ctx.military.length/12)));if(ctx.config.scouts===0)count=0;if(stealth&&ctx.targets.length)count=Math.max(0,Math.min(count,candidates.length-1));let chosen=candidates.slice(0,count);
 if(!chosen.length&&!stealth&&g.time>75&&ctx.workers.length>=8&&ctx.targets.length===0){const worker=ctx.workers.find(u=>u.aiScoutUntil>g.time&&u.hp>u.maxHp*.45)||ctx.workers.filter(u=>!['build','repair'].includes(u.order?.kind)&&u.carry<1&&u.hp>u.maxHp*.8).sort((a,b)=>dist(b,p.home)-dist(a,p.home))[0];if(worker)chosen=[worker];}
 const chosenIds=new Set(chosen.map(u=>u.id));for(const u of [...ctx.military,...ctx.workers])if(u.aiScoutUntil>g.time&&!chosenIds.has(u.id)){u.aiScoutUntil=0;u.aiScoutGoal=null;}
 for(const u of chosen){u.aiScoutUntil=g.time+ctx.config.think+3;const ud=D.units[u.type],threat=ctx.enemy.filter(e=>{const d=g.def(e);return(d.damage>0||d.kind==='defense')&&(!ud.air||d.aa||d.kind==='defense')&&dist(u,e)<(d.kind==='defense'?10:(d.range||1)+2.3);}).sort((a,b)=>dist(u,a)-dist(u,b))[0];
 if(threat||u.hp<u.maxHp*.45){const away=threat?Math.atan2(u.y-threat.y,u.x-threat.x):Math.atan2(p.home.y-u.y,p.home.x-u.x);let goal={x:Math.max(1,Math.min(g.n-1,u.x+Math.cos(away)*6)),y:Math.max(1,Math.min(g.n-1,u.y+Math.sin(away)*6))};if(g.blocked(goal.x,goal.y,!!ud.air,p.id))goal={x:p.home.x+3,y:p.home.y+3};if(g.time>=(u.aiScoutReorder||0)){g.order([u.id],{kind:'move',...goal});u.aiScoutReorder=g.time+2;}if(u.aiScoutGoal)s.scoutVisited[u.aiScoutGoal.key]=g.time+35;u.aiScoutGoal=null;continue;}
 const previous=u.aiScoutGoal,arrived=previous&&dist(u,previous)<3,stalled=previous&&(u.stuck>2||g.time-(u.aiScoutProgressAt||0)>13);if(previous&&(arrived||stalled||g.time-(u.aiScoutStarted||0)>40)){s.scoutVisited[previous.key]=g.time+(stalled?55:24);u.aiScoutGoal=null;}
 if(previous&&u.aiScoutLast&&dist(u,u.aiScoutLast)>1){u.aiScoutProgressAt=g.time;u.aiScoutLast={x:u.x,y:u.y};}
 if(!u.aiScoutGoal){const goal=explorationGoal(g,p,u,ctx);if(!goal){u.aiScoutUntil=0;continue;}u.aiScoutGoal=goal;u.aiScoutStarted=g.time;u.aiScoutProgressAt=g.time;u.aiScoutLast={x:u.x,y:u.y};s.metrics.scoutOrders++;g.order([u.id],{kind:'move',x:goal.x,y:goal.y});}else if(!u.order&&g.time>=(u.aiScoutReorder||0)){g.order([u.id],{kind:'move',x:u.aiScoutGoal.x,y:u.aiScoutGoal.y});u.aiScoutReorder=g.time+3;}}
 for(const [key,expiry]of Object.entries(s.scoutVisited))if(expiry+120<g.time)delete s.scoutVisited[key];
}
function context(g,p){const f=D.factions[p.faction],config=configuration(g,p),own=g.entities.filter(e=>e.hp>0&&e.owner===p.id),workers=own.filter(e=>e.kind==='unit'&&D.units[e.type].worker),military=own.filter(e=>e.kind==='unit'&&!D.units[e.type].worker),buildings=own.filter(e=>e.kind==='building'),ready=buildings.filter(b=>b.progress>=1),enemy=g.entities.filter(e=>e.hp>0&&e.owner!==undefined&&g.hostile(p.id,e.owner)&&g.visible(p.id,e)&&g.detectable(p.id,e)),ctx={f,own,workers,military,buildings,ready,enemy,config,difficulty:config.id};ctx.knownEnemies=observe(g,p,enemy,config);ctx.targets=targetList(g,p,ctx);ctx.target=ctx.targets[0]||null;return ctx;}
function step(g,p){const s=state(p),config=configuration(g,p);if(g.time<(s.nextThink||0))return;s.nextThink=g.time+config.think-.04;s.metrics.decisions++;const ctx=context(g,p);const planner=root.FractureAIEconomy||(typeof require!=='undefined'?require('./ai-economy.js'):null);if(g.time>=(s.nextEconomy||0))planner.sustainability(g,p,ctx);const logistics=root.FractureAILogistics||(typeof require!=='undefined'?require('./ai-logistics.js'):null);logistics?.step(g,p,ctx);ctx.military=ctx.military.filter(u=>!u.aiLogistics&&!u.embarkedBy&&!D.units[u.type].transport&&!D.units[u.type].naval&&D.units[u.type].role!=='merchant');ctx.workers=ctx.workers.filter(u=>!u.aiLogistics&&!u.embarkedBy&&u.order?.kind!=='extract');if((ctx.target?.id||null)!==(s.targetId||null)){s.targetId=ctx.target?.id||null;s.metrics.targetChanges++;}const economy=root.FractureAIEconomy||(typeof require!=='undefined'?require('./ai-economy.js'):null),combat=root.FractureAICombat||(typeof require!=='undefined'?require('./ai-combat.js'):null);if(g.time>=(s.nextEconomy||0)){economy.step(g,p,{...ctx,military:ctx.own.filter(u=>u.kind==='unit'&&!D.units[u.type].worker&&!D.units[u.type].naval&&!D.units[u.type].transport&&D.units[u.type].role!=='merchant')});s.nextEconomy=g.time+Math.max(.8,config.think)-.04;}scout(g,p,ctx);combat.step(g,p,ctx);}
root.FractureAI={step,context,observe,targetList,explorationGoal,scout,configs,levels,configFor,configuration};if(typeof module!=='undefined')module.exports=root.FractureAI;
})(globalThis);
