'use strict';
// Shared strategic perception. All plans use the same private fog knowledge as a player.
(function(root){
const D=root.FD||(typeof require!=='undefined'?require('./data.js'):null),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
// Ordered from a forgiving learning opponent to the strongest challenge controller.
// `grade` is the competence rank that every capability gate reads. It is deliberately
// decoupled from `level` (the menu position) so that the ladder can be recalibrated
// without silently moving behaviour between tiers. Standard carries grade 10: it is the
// former Apocalypse controller, preserved exactly, and now the reference baseline.
const levels=[
 // id,name,grade,think,workerTarget,maxMilitary,minAttack,attackRatio,memory,scouts,techPace,productionLimit
 ['gentle','Gentle',1,4,7,16,12,1.85,35,1,1.8,1],
 ['relaxed','Relaxed',2,3.2,9,24,11,1.6,40,1,1.5,1],
 ['easy','Easy',4,2.4,10,32,9,1.4,45,1,1.25,2],
 ['standard','Standard',10,.3,32,136,6,1.0,180,3,.8,4],
 ['challenging','Challenging',11,.3,32,136,6,1.0,180,3,.8,4],
 ['veteran','Veteran',12,.3,32,136,6,1.0,180,3,.8,4],
 ['expert','Expert',13,.3,32,136,6,1.0,180,3,.8,4],
 ['master','Master',14,.3,32,136,6,1.0,180,3,.8,4],
 ['nightmare','Nightmare',15,.3,32,136,6,1.0,180,3,.8,4],
 ['apocalypse','Apocalypse',16,.3,32,136,6,1.0,180,3,.8,4]
].map(([id,name,grade,think,workerTarget,maxMilitary,minAttack,attackRatio,memory,scouts,techPace,productionLimit],index)=>{
 const level=index+1,profile={id,name,level,grade,think,workerTarget,maxMilitary,minAttack,attackRatio,memory,scouts,techPace,productionLimit:grade>=9?Math.min(13,grade-3):productionLimit,
  economyRates:Object.freeze({gather:1,production:1}),
  adaptiveEconomy:grade>=5,forecastFire:grade>=7,screenArtillery:grade>=8,domainMicro:grade>=6,
  investmentBuffer:grade>=5?1+(grade-5)*.16:0,
  tacticalInterval:Math.max(.3,2.4-(grade-4)*.35),
  counterWeight:Math.max(0,Math.min(1.2,(grade-3)/7)),constructionCrew:grade>=9?3:grade>=6?2:1,
  focusFire:grade>=4,kite:grade>=4,abilities:grade>=4,flank:grade>=6,splashFocus:grade>=8,
  retreatRatio:grade<=3?1.55:grade<=5?1.4:grade<=7?1.28:1.2,
  withdrawHealth:grade>=8?.3:.24,regroupDelay:Math.max(10,34-grade*2),attackDelay:Math.max(10,48-grade*4),
  assembleTime:grade>=8?12:20,reinforceDelay:grade>=8?10:18,reinforceMinimum:grade>=8?4:5,reinforceReserve:grade>=8?1:2,
  flankFraction:grade>=8?.32:.25,flankLimit:grade>=8?8:5,
  // Collection capacity: how many paid collection sites per resource the controller will
  // charter, how early it starts and how many workers it wants before expanding. These are
  // purchased under ordinary rules; nothing here changes prices, rates or yields.
  expansionLimit:3,expansionAt:110,expansionWorkers:9,expansionSites:1,
  // Stronger controllers earn their edge from more reliable information and
  // deliberate use of terrain, never from modified economic or combat rules.
  intelligenceLed:grade>=11,intelFreshness:grade>=14?55:70,
  fortifyApproaches:grade>=12,operationalMemory:grade>=16,
  // Home defence: hold back a real share of the army. Crude fixed share at low grades;
  // capable grades size the guard against observed enemy strength.
  garrisonFraction:grade<=2?.12:grade<=4?.16:.18,adaptiveGarrison:grade>=11};
 // Standard preserves the former Apocalypse profile verbatim. Levels below it are
 // progressively less capable; levels above it add collection reach and decision
 // commitment, the two competences the former ladder had saturated.
 const tuning={
  // Gentle: learning mode — slow, small army, no micro, no aggression for 10 minutes.
  gentle:{think:18,workerTarget:6,maxMilitary:6,minAttack:2,attackRatio:2.2,techPace:3.6,
   attackNotBefore:600,expansionLimit:1,expansionAt:400,expansionWorkers:14,
   focusFire:false,kite:false,abilities:false,flank:false,domainMicro:false,
   splashFocus:false,forecastFire:false,screenArtillery:false},

  // Relaxed: basic economy, small army, no micro — attacks but won't outplay anyone.
  relaxed:{think:3.2,workerTarget:9,maxMilitary:18,attackRatio:1.6,techPace:1.6,
   expansionLimit:1,expansionAt:240,expansionWorkers:12,
   focusFire:false,kite:false,abilities:false,flank:false,domainMicro:false,
   splashFocus:false,forecastFire:false,screenArtillery:false},

  // Easy: starts using unit abilities and focus fire — first sign of micro.
  easy:{think:2.4,workerTarget:13,maxMilitary:36,attackRatio:1.35,techPace:1.2,
   expansionLimit:2,expansionAt:150,expansionWorkers:10,
   focusFire:true,abilities:true,recoveryCoordination:true},

  // Standard: the baseline — solid all-around play. Everything below gates off Standard features.
  standard:{techPace:.7,think:.15,workerTarget:40,maxMilitary:156,investmentBuffer:.55,
   macroForecast:true,battleAssessment:true,pressureProduction:true,recoveryCoordination:true,
   expansionLimit:3,expansionAt:110,expansionWorkers:9},

  // Challenging: Standard + commitment + adaptive garrison + early raids.
  // NEW: starts counterattacking after a successful defense, scouts more aggressively.
  challenging:{techPace:.7,think:.14,workerTarget:44,maxMilitary:170,investmentBuffer:.5,
   macroForecast:true,battleAssessment:true,pressureProduction:true,recoveryCoordination:true,
   commitment:true,adaptiveGarrison:true,
   counterattackAfterDefense:true,  // NEW: launches attack right after repelling enemy
   aggressiveScouts:true,           // NEW: scouts push deeper into enemy territory
   expansionLimit:4,expansionAt:100,expansionWorkers:8,memory:200,scouts:4},

  // Veteran: Challenging + counter-production + choke point awareness.
  // NEW: picks unit composition to counter what it sees, fortifies choke points with towers.
  veteran:{techPace:.7,think:.13,workerTarget:48,maxMilitary:185,investmentBuffer:.45,
   macroForecast:true,battleAssessment:true,pressureProduction:true,recoveryCoordination:true,
   commitment:true,adaptiveGarrison:true,counterattackAfterDefense:true,aggressiveScouts:true,
   counterProduction:true,          // NEW: builds units that counter enemy composition
   chokePointTowers:true,           // NEW: builds towers at choke points
   expansionLimit:5,expansionAt:92,expansionWorkers:7,memory:220,scouts:4},

  // Expert: Veteran + economic raids + multi-prong attacks.
  // NEW: sends fast units to kill enemy workers/extractors while main army fights.
  expert:{techPace:.7,think:.12,workerTarget:52,maxMilitary:200,investmentBuffer:.4,
   macroForecast:true,battleAssessment:true,pressureProduction:true,recoveryCoordination:true,
   commitment:true,adaptiveGarrison:true,counterattackAfterDefense:true,aggressiveScouts:true,
   counterProduction:true,chokePointTowers:true,
   economicRaids:true,             // NEW: raids target extractors & depots, not just workers
   multiProngAttack:true,          // NEW: splits force to attack from two directions
   expansionLimit:6,expansionAt:84,expansionWorkers:7,memory:240,scouts:4},

  // Master: Expert + choke point traps + reserve management + emergency production.
  // NEW: plants traps at narrow passes, keeps a reserve force for opportunities.
  master:{techPace:.7,think:.11,workerTarget:56,maxMilitary:215,investmentBuffer:.36,
   macroForecast:true,battleAssessment:true,pressureProduction:true,recoveryCoordination:true,
   commitment:true,adaptiveGarrison:true,counterattackAfterDefense:true,aggressiveScouts:true,
   counterProduction:true,chokePointTowers:true,economicRaids:true,multiProngAttack:true,
   chokePointTraps:true,           // NEW: plants traps at narrow passes
   reserveForce:true,              // NEW: keeps a tactical reserve for counterattacks/flanks
   emergencyProduction:true,       // NEW: builds extra production after repeated failures
   expansionLimit:7,expansionAt:78,expansionWorkers:6,memory:260,scouts:5},

  // Nightmare: Master + relentless pressure + map-wide harassment + tech rushing.
  // NEW: never lets up — constant raids, attacks while rebuilding, hits everywhere.
  nightmare:{techPace:.65,think:.10,workerTarget:60,maxMilitary:230,investmentBuffer:.32,
   macroForecast:true,battleAssessment:true,pressureProduction:true,recoveryCoordination:true,
   commitment:true,adaptiveGarrison:true,counterattackAfterDefense:true,aggressiveScouts:true,
   counterProduction:true,chokePointTowers:true,economicRaids:true,multiProngAttack:true,
   chokePointTraps:true,reserveForce:true,emergencyProduction:true,
   relentlessPressure:true,        // NEW: attacks again immediately after retreating
   simultaneousRaids:true,         // NEW: runs 2 raid squads at once
   techRush:true,                  // NEW: prioritizes upgrades before maxing economy
   expansionLimit:8,expansionAt:72,expansionWorkers:6,memory:280,scouts:5,
   regroupDelay:7,retreatRatio:1.15,flankFraction:.38,flankLimit:10},

  // Apocalypse: Nightmare plus adaptive operational planning; strength is measured in matches.
  // Uses observed opportunities, paid counters and persistent reconnaissance.
  apocalypse:{techPace:.6,think:.08,workerTarget:64,maxMilitary:250,investmentBuffer:.25,
   macroForecast:true,battleAssessment:true,pressureProduction:true,recoveryCoordination:true,
   commitment:true,adaptiveGarrison:true,counterattackAfterDefense:true,aggressiveScouts:true,
   counterProduction:true,chokePointTowers:true,economicRaids:true,multiProngAttack:true,
   chokePointTraps:true,reserveForce:true,emergencyProduction:true,
   relentlessPressure:true,simultaneousRaids:true,techRush:true,
   precisionStrike:true,           // NEW: targets the weakest point of enemy defense
   fullMapControl:true,            // NEW: maintains vision over entire map with scout rotation
   adaptiveComposition:true,       // NEW: shifts entire army composition mid-game based on threats
   expansionLimit:10,expansionAt:60,expansionWorkers:5,memory:360,scouts:6,
   regroupDelay:5,retreatRatio:1.1,flankFraction:.42,flankLimit:12,
   reinforceDelay:6,reinforceMinimum:2,reinforceReserve:0,assembleTime:8}
 };
 return Object.freeze(tuning[id]?{...profile,...tuning[id]}:profile);
});
const configs=Object.fromEntries(levels.map(c=>[c.id,c]));
const routerConfig=Object.freeze({...configs.apocalypse,id:'openrouter',name:'OpenRouter Strategist',externalStrategy:true});
// Original save IDs remain valid; only the ten named levels appear in setup.
function configFor(value){if(value==='openrouter')return routerConfig;return configs[value==='normal'?'standard':value==='hard'?'expert':value]||configs.standard;}
function configuration(g,p){return configFor(p?.aiDifficulty||g.options.difficulty);}

function state(p){if(!p.aiState)p.aiState={};const s=p.aiState;s.contacts=s.contacts||{};s.scoutVisited=s.scoutVisited||{};s.metrics=s.metrics||{decisions:0,observations:0,scoutOrders:0,targetChanges:0};return s;}
function observe(g,p,enemy,config){const s=state(p),seen=new Set();for(const e of enemy){seen.add(e.id);if(!s.contacts[e.id])s.metrics.observations++;s.contacts[e.id]={id:e.id,kind:e.kind,type:e.type,owner:e.owner,x:e.x,y:e.y,hp:e.hp,maxHp:e.maxHp,size:e.size||0,seenAt:g.time};}
 for(const [id,e]of Object.entries(s.contacts))if(!seen.has(Number(id))&&(g.time-e.seenAt>config.memory||g.visible(p.id,e)))delete s.contacts[id];return Object.values(s.contacts);
}
function targetList(g,p,ctx){const s=state(p),byId=new Map();for(const e of Object.values(p.knowledge||{}))if(e.kind==='building'&&e.hp>0&&g.hostile(p.id,e.owner))byId.set(e.id,{...e,seenAt:e.seenAt??0});for(const e of ctx.enemy)if(e.kind==='building')byId.set(e.id,{...e,seenAt:g.time});
 const force=ctx.military.filter(u=>!u.aiScoutUntil||u.aiScoutUntil<g.time),anchor=force.length?{x:force.reduce((n,u)=>n+u.x,0)/force.length,y:force.reduce((n,u)=>n+u.y,0)/force.length}:p.home,values={hq:100,inf:82,armor:90,air:90,elite:95,lab:65,counter:62,extractor:70,depot:65,house:40,defense:25};
 const targets=[...byId.values()].map(e=>{const d=D.buildings[e.type],guard=ctx.knownEnemies.reduce((n,v)=>{if(v.id===e.id||dist(v,e)>10)return n;const vd=v.kind==='unit'?D.units[v.type]:D.buildings[v.type],fresh=Math.max(.15,1-(g.time-v.seenAt)/ctx.config.memory);return n+fresh*(vd.kind==='defense'?25:vd.damage>0?Math.min(20,Math.sqrt(v.hp)*vd.damage/(vd.cooldown||1.25)/55):0);},0);return{...e,score:(values[d.kind]||45)+(g.time>360&&['hq','inf','armor','air','elite'].includes(d.kind)?45:0)-dist(anchor,e)*1.25-guard+(e.hp<e.maxHp*.4?18:0),guard};});targets.sort((a,b)=>b.score-a.score||a.id-b.id);
 // Penalize remembered unreachable strongholds, without inspecting unrevealed ground.
 if(g.time>=(s.routeReviewAt||0)){s.routeReviewAt=g.time+8;s.routePenalty={};const probe=force.find(u=>!D.units[u.type].air&&!D.units[u.type].naval&&!u.embarkedBy)||ctx.workers[0];if(probe)for(const t of targets.slice(0,4)){const dest=g.approach(probe,t,1),route=g.path(probe,dest),end=route.at(-1)||probe;if(dist(end,dest)>3)s.routePenalty[t.id]=90;}}
 for(const t of targets){t.score-=s.routePenalty?.[t.id]||0;
 if(ctx.config.precisionStrike)t.score+=Math.min(25,(1-t.hp/Math.max(1,t.maxHp))*30)-t.guard*.45;
  // The top controller records failed approaches. It changes objectives after a
  // genuine withdrawal instead of repeatedly feeding a rebuilt army into the
  // same known defense; this uses only its own prior operations and observations.
  if(ctx.config.operationalMemory&&(s.attackHistory||[]).some(h=>h.targetId===t.id&&h.result==='retreat'&&g.time-h.time<180))t.score-=110;
 }targets.sort((a,b)=>b.score-a.score||a.id-b.id);
 // Keep a useful objective through small scouting fluctuations, but never retain a
 // route known to be unusable or override an urgent, substantially better target.
 if(ctx.config.commitment&&targets.length){const old=targets.find(t=>t.id===s.committedTarget);
  if(old&&!(s.routePenalty?.[old.id])&&targets[0].score-old.score<18&&g.time<(s.commitUntil||0))targets.splice(0,0,...targets.splice(targets.indexOf(old),1));
  if(targets[0].id!==s.committedTarget){s.committedTarget=targets[0].id;s.commitUntil=g.time+18;}
 }return targets;
}
function explorationGoal(g,p,u,ctx){const s=state(p),n=g.n,radius=Math.min(10,D.units[u.type].vision||8),recon=p.aiReconTarget;let best=null,score=-Infinity;const routes=[];
 // An operation with stale intelligence gets a targeted perimeter check before
 // another random frontier sweep. The destination is an observed location, not
 // hidden state, and normal route/fog checks still apply.
 if(recon&&recon.x!==undefined&&recon.y!==undefined){const a=Math.atan2(u.y-recon.y,u.x-recon.x),q={x:recon.x+Math.cos(a)*Math.max(5,radius-1),y:recon.y+Math.sin(a)*Math.max(5,radius-1)},key='recon:'+recon.id;
  if(q.x>1&&q.y>1&&q.x<n-1&&q.y<n-1&&g.known(p.id,q)&&!g.blocked(q.x,q.y,!!D.units[u.type].air,p.id)){const path=g.path(u,q);if(dist(path.at(-1)||u,q)<2.5)return{...q,key,recon:true};}}
 // Frontier candidates on a 3-tile grid, scored within 90 tiles of the scout first: a whole-map pass is
 // about 54,000 candidates on Colossal for every scouting decision, and distant ones score far lower
 // anyway (travel costs .65 a tile). The whole map is scanned only when nothing nearby qualifies.
 const scan=(x0,x1,y0,y1)=>{for(let y=y0;y<y1;y+=3)for(let x=x0;x<x1;x+=3){const q={x:x+.5,y:y+.5},i=y*n+x;if(g.blocked(q.x,q.y,!!D.units[u.type].air,p.id))continue;const key=x+':'+y;if((s.scoutVisited[key]||0)>g.time)continue;let gain=0,edge=false;for(let dy=-6;dy<=6;dy+=3)for(let dx=-6;dx<=6;dx+=3){const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=n||yy>=n||Math.hypot(dx,dy)>radius)continue;if(!p.explored[yy*n+xx])gain++;else edge=true;}if(!gain||!edge)continue;
 const danger=ctx.enemy.reduce((a,e)=>{const d=g.def(e);return a+(d.damage>0||d.kind==='defense'?Math.max(0,12-dist(q,e))*5:0);},0),separation=(ctx.config.recoveryCoordination?[...ctx.military,...ctx.workers]:ctx.military).some(v=>v.id!==u.id&&v.aiScoutUntil>g.time&&v.aiScoutGoal&&dist(v.aiScoutGoal,q)<9)?25:0,travel=dist(u,q),value=gain*2.5-travel*.65-danger-separation+(p.explored[i]?0:2);
 if(ctx.config.recoveryCoordination)routes.push({...q,key,score:value});if(value>score){score=value;best={...q,key};}}};
 const grid=v=>2+3*Math.max(0,Math.ceil((v-2)/3)),W=90;scan(grid(Math.floor(u.x)-W),Math.min(n-2,Math.floor(u.x)+W),grid(Math.floor(u.y)-W),Math.min(n-2,Math.floor(u.y)+W));
 if(!best&&!routes.length&&(u.x-W>2||u.y-W>2||u.x+W<n-2||u.y+W<n-2))scan(2,n-2,2,n-2);
 if(ctx.config.recoveryCoordination){best=null;for(const q of routes.sort((a,b)=>b.score-a.score).slice(0,12)){const path=g.path(u,q);if(dist(path.at(-1)||u,q)<2.5){best=q;break;}s.scoutVisited[q.key]=g.time+60;}}
 if(!best){for(const t of ctx.targets){const angle=Math.atan2(u.y-t.y,u.x-t.x),q={x:t.x+Math.cos(angle)*9,y:t.y+Math.sin(angle)*9},key='watch:'+t.id;if((s.scoutVisited[key]||0)>g.time||g.blocked(q.x,q.y,!!D.units[u.type].air,p.id))continue;best={...q,key};break;}}return best;
}
function scout(g,p,ctx){const s=state(p),candidates=ctx.military.filter(u=>D.units[u.type].role==='scout'&&u.hp>u.maxHp*.45&&!u.returning&&!(u.aiWithdrawUntil>g.time)).sort((a,b)=>D.units[b.type].speed-D.units[a.type].speed||a.id-b.id),stealth=ctx.knownEnemies.some(e=>D.units[e.type]?.stealth);let count=Math.min(ctx.config.scouts,Math.max(1,Math.floor(ctx.military.length/12)));if(ctx.config.aggressiveScouts)count=Math.min(ctx.config.scouts,Math.max(1,Math.floor(ctx.military.length/8)));if(ctx.config.scouts===0)count=0;if(stealth&&ctx.targets.length)count=Math.max(0,Math.min(count,candidates.length-1));let chosen=candidates.slice(0,count);
 const seekIncome=(ctx.config.recoveryCoordination||p.aiState?.recovery?.stalled)&&(p.aiSustainability?.remaining[0]===0||p.aiState?.recovery?.stalled);
 if(!chosen.length&&!stealth&&g.time>(seekIncome?10:75)&&ctx.workers.length>=(seekIncome?2:8)&&(p.aiReconTarget||ctx.targets.length===0||seekIncome||ctx.config.recoveryCoordination&&p.aiSustainability?.cost.some((cost,r)=>p.stock[r]<cost&&(p.aiSustainability.remaining[r]||0)<cost-p.stock[r]))){const budget=seekIncome&&ctx.config.recoveryCoordination?Math.min(Math.max(1,ctx.workers.length-2),1+Math.floor((ctx.config.level-3)/3)):1;const active=ctx.workers.filter(u=>u.aiScoutUntil>g.time&&u.hp>u.maxHp*.45),free=ctx.workers.filter(u=>!active.includes(u)&&!u.aiLogistics&&!u.embarkedBy&&!['build','repair','extract'].includes(u.order?.kind)&&u.carry<1&&u.hp>u.maxHp*.8).sort((a,b)=>dist(b,p.home)-dist(a,p.home));chosen=[...active,...free].slice(0,budget);}
 const chosenIds=new Set(chosen.map(u=>u.id));for(const u of [...ctx.military,...ctx.workers])if(u.aiScoutUntil>g.time&&!chosenIds.has(u.id)){u.aiScoutUntil=0;u.aiScoutGoal=null;}
 for(const u of chosen){u.aiScoutUntil=g.time+ctx.config.think+3;const ud=D.units[u.type],threat=ctx.enemy.filter(e=>{const d=g.def(e);return(d.damage>0||d.kind==='defense')&&(!ud.air||d.aa||d.kind==='defense')&&dist(u,e)<(d.kind==='defense'?10:(d.range||1)+2.3);}).sort((a,b)=>dist(u,a)-dist(u,b))[0];
 if(threat||u.hp<u.maxHp*.45){const away=threat?Math.atan2(u.y-threat.y,u.x-threat.x):Math.atan2(p.home.y-u.y,p.home.x-u.x);let goal={x:Math.max(1,Math.min(g.n-1,u.x+Math.cos(away)*6)),y:Math.max(1,Math.min(g.n-1,u.y+Math.sin(away)*6))};if(g.blocked(goal.x,goal.y,!!ud.air,p.id))goal={x:p.home.x+3,y:p.home.y+3};if(g.time>=(u.aiScoutReorder||0)){g.order([u.id],{kind:'move',...goal});u.aiScoutReorder=g.time+2;}if(u.aiScoutGoal)s.scoutVisited[u.aiScoutGoal.key]=g.time+35;u.aiScoutGoal=null;continue;}
 const previous=u.aiScoutGoal,arrived=previous&&dist(u,previous)<3,stalled=previous&&(u.stuck>2||g.time-(u.aiScoutProgressAt||0)>13);if(previous&&(arrived||stalled||g.time-(u.aiScoutStarted||0)>40)){s.scoutVisited[previous.key]=g.time+(stalled?55:ctx.config.fullMapControl?12:24);u.aiScoutGoal=null;}
 if(previous&&u.aiScoutLast&&dist(u,u.aiScoutLast)>1){u.aiScoutProgressAt=g.time;u.aiScoutLast={x:u.x,y:u.y};}
 if(!u.aiScoutGoal){const goal=explorationGoal(g,p,u,ctx);if(!goal){u.aiScoutUntil=0;continue;}u.aiScoutGoal=goal;u.aiScoutStarted=g.time;u.aiScoutProgressAt=g.time;u.aiScoutLast={x:u.x,y:u.y};s.metrics.scoutOrders++;g.order([u.id],{kind:'move',x:goal.x,y:goal.y});}else if(!u.order&&g.time>=(u.aiScoutReorder||0)){g.order([u.id],{kind:'move',x:u.aiScoutGoal.x,y:u.aiScoutGoal.y});u.aiScoutReorder=g.time+3;}
  if(p.aiReconTarget&&g.visible(p.id,{x:p.aiReconTarget.x,y:p.aiReconTarget.y})){p.aiReconTarget=null;p.aiReconRequestedAt=0;}}
 for(const [key,expiry]of Object.entries(s.scoutVisited))if(expiry+120<g.time)delete s.scoutVisited[key];
}
function context(g,p){const f=D.factions[p.faction],config=configuration(g,p),own=g.entities.filter(e=>e.hp>0&&e.owner===p.id),workers=own.filter(e=>e.kind==='unit'&&D.units[e.type].worker),military=own.filter(e=>e.kind==='unit'&&!D.units[e.type].worker),buildings=own.filter(e=>e.kind==='building'),ready=buildings.filter(b=>b.progress>=1),enemy=g.entities.filter(e=>e.hp>0&&e.owner!==undefined&&g.hostile(p.id,e.owner)&&g.visible(p.id,e)&&g.detectable(p.id,e)),ctx={f,own,workers,military,buildings,ready,enemy,config,difficulty:config.id};ctx.knownEnemies=observe(g,p,enemy,config);ctx.targets=targetList(g,p,ctx);ctx.target=ctx.targets[0]||null;return ctx;}
function step(g,p){const s=state(p),config=configuration(g,p);if(g.time<(s.nextThink||0))return;s.nextThink=g.time+config.think-.04;s.metrics.decisions++;const ctx=context(g,p);if(config.externalStrategy)root.FractureOpenRouter?.request(g,p,ctx);const planner=root.FractureAIEconomy||(typeof require!=='undefined'?require('./ai-economy.js'):null);planner.recover(g,p,ctx);if(g.time>=(s.nextEconomy||0))planner.sustainability(g,p,ctx);const logistics=root.FractureAILogistics||(typeof require!=='undefined'?require('./ai-logistics.js'):null);logistics?.step(g,p,ctx);ctx.military=ctx.military.filter(u=>!u.aiLogistics&&!u.embarkedBy&&!D.units[u.type].transport&&!D.units[u.type].naval&&D.units[u.type].role!=='merchant');ctx.workers=ctx.workers.filter(u=>!u.aiLogistics&&!u.embarkedBy&&u.order?.kind!=='extract');if((ctx.target?.id||null)!==(s.targetId||null)){s.targetId=ctx.target?.id||null;s.metrics.targetChanges++;}const economy=root.FractureAIEconomy||(typeof require!=='undefined'?require('./ai-economy.js'):null),combat=root.FractureAICombat||(typeof require!=='undefined'?require('./ai-combat.js'):null);if(g.time>=(s.nextEconomy||0)){economy.step(g,p,{...ctx,military:ctx.own.filter(u=>u.kind==='unit'&&!D.units[u.type].worker&&!D.units[u.type].naval&&!D.units[u.type].transport&&D.units[u.type].role!=='merchant')});s.nextEconomy=g.time+Math.max(.8,config.think)-.04;}scout(g,p,ctx);combat.step(g,p,ctx);}
root.FractureAI={step,context,observe,targetList,explorationGoal,scout,configs,levels,configFor,configuration};if(typeof module!=='undefined')module.exports=root.FractureAI;
})(globalThis);
