'use strict';
(function(root){
const D=root.FD||(typeof require!=='undefined'?require('./data.js'):null),C=root.FractureCombat||(typeof require!=='undefined'?require('./combat.js'):null);
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y), alive=e=>e&&e.hp>0;
const sumCost=(a,b,k=1)=>a.map((v,i)=>v+(b?.[i]||0)*k);
const definition=e=>e?.kind==='unit'?D.units[e.type]:D.buildings[e?.type];
const queueOf=b=>b.queue||[];
// Identify narrow passages on the map between the AI's base and known enemy positions.
// A choke point is a walkable tile where the number of walkable tiles in a small radius
// is unusually low — a bottleneck. Only considers explored terrain on paths toward enemies.
function counterDemand(u,known,army,time,adaptive=false){
 const enemies=known.filter(e=>e.kind==='unit'&&D.units[e.type]?.damage>0&&time-(e.seenAt??time)<75);
 if(!enemies.length)return 0;
 let score=0,total=0;
 for(const e of enemies){const t=D.units[e.type],fresh=Math.max(.15,1-(time-(e.seenAt??time))/75);
  const effective=a=>(t.air&&!a.aa||a.airOnly&&!t.air)?0:C.multiplier(a,t);
  const covered=army.filter(a=>a.damage>0&&effective(a)>=1.25).length;
  score+=fresh*(effective(u)-1)*24/(1+covered*.25);total+=fresh;
 }
 return Math.max(-24,Math.min(adaptive?36:24,score/Math.max(1,total)*(adaptive?1.5:1)));
}
function findChokePoints(g,p,config){
 const state=p.aiState||(p.aiState={});
 if(g.time<(state.chokeReviewAt||0))return state.chokePoints||[];
 state.chokeReviewAt=g.time+20;
 const probe=g.entities.find(e=>e.owner===p.id&&e.hp>0&&e.kind==='unit'&&D.units[e.type]?.worker&&!e.embarkedBy);
 if(!probe)return state.chokePoints=[];
 const targets=Object.values(p.knowledge||{}).filter(e=>e.kind==='building'&&g.hostile(p.id,e.owner)&&['hq','inf','armor'].includes(D.buildings[e.type]?.kind));
 const results=[],n=g.n;
 // Follow actual discovered walking routes, including bends and ramps. A straight
 // line across a cliff or sea is not a usable defensive approach.
 for(const t of targets.slice(0,2)){
  const goal=g.approach(probe,t,1),route=g.path(probe,goal);
  if(distance(route.at(-1)||probe,goal)>3)continue;
  for(let k=3;k<route.length;k+=3){const q=route[k],cx=Math.floor(q.x),cy=Math.floor(q.y);
   if(distance(q,p.home)<15||distance(q,t)<15||!g.known(p.id,q))continue;
   let walkable=0,total=0,unknown=false;
   for(let oy=-6;oy<=6;oy++)for(let ox=-6;ox<=6;ox++){
    if(Math.hypot(ox,oy)>6)continue;
    const x=cx+ox,y=cy+oy;total++;
    if(x<0||y<0||x>=n||y>=n)continue;
    if(!p.explored[y*n+x]){unknown=true;continue;}
    if(!g.blocked(x+.5,y+.5,false,p.id))walkable++;
   }
   const ratio=walkable/Math.max(1,total);
   if(!unknown&&ratio>.08&&ratio<.68)results.push({x:cx+.5,y:cy+.5,narrow:ratio});
  }
 }
 results.sort((a,b)=>a.narrow-b.narrow);const unique=[];
 for(const q of results)if(!unique.some(v=>distance(v,q)<10))unique.push(q);
 return state.chokePoints=unique.slice(0,4);
}
function segmentDistance(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(p.x-a.x-dx*t,p.y-a.y-dy*t);}
// The resource list is a view of private memory, refreshed only at visible locations.
// In particular, a depleted deposit outside vision must not change AI decisions.
function knownResources(g,p){
 const current=new Map();for(const e of g.entitiesByKind?g.entitiesByKind('resource'):g.entities||[])if(e.kind==='resource'&&g.visible(p.id,e)&&e.hp>0&&e.amount>0)current.set(e.id,e);
 const result=new Map();for(const e of Object.values(p.knowledge||{}))if(e.kind==='resource'&&e.hp>0&&e.amount>0&&!g.visible(p.id,e))result.set(e.id,{...e,observed:false});
 for(const e of current.values())result.set(e.id,{...e,observed:true});return [...result.values()];
}
// Price the complete renewable-economy chain before any controller spends.
// Already paid foundations/research queues are excluded; all four currencies matter.
function sustainability(g,p,ctx={}){
 const own=(ctx.own||g.entities.filter(e=>e.owner===p.id)).filter(alive),workers=own.filter(e=>e.kind==='unit'&&definition(e)?.worker&&!e.embarkedBy),f=D.factions[p.faction];
 const config=ctx.config||(root.FractureAI||(typeof require!=='undefined'?require('./ai.js'):null)).configuration(g,p);
 const firstIncome=config.recoveryCoordination&&g.options.startingResources===false&&(p.gathered?.[0]||0)<1;
 const completed=id=>p.tech.includes(id)||own.some(e=>e.type===id&&e.kind==='building');
 const pending=id=>own.some(e=>e.queue?.some(q=>q.type===id));
 const need=new Map();function add(id){if(!id||completed(id)||pending(id)||need.has(id))return;const d=D.buildings[id]||D.research[id]||D.units[id];if(!d)return;need.set(id,d);for(const r of d.requires||[])add(r);add(d.research);if(D.research[id]||D.units[id])add(d.building);}
 const cache=p.aiSupplyRoutes||(p.aiSupplyRoutes={}),nodes=knownResources(g,p),exhausted=Object.values(p.knowledge||{}).filter(n=>n.kind==='resource'&&n.amount<=0);
 const reachable=n=>{const candidates=workers.filter(w=>!w.aiLogistics).sort((a,b)=>distance(a,n)-distance(b,n)).slice(0,3),signature=candidates.map(w=>w.id+':'+Math.floor(w.x/8)+':'+Math.floor(w.y/8)).join(','),c=cache[n.id];if(c&&c.signature===signature&&c.until>g.time)return c.ok;const ok=candidates.some(w=>{return g.knownRoute(w,g.approach(w,n,.7));});cache[n.id]={ok,signature,revision:p.navigationRevision,until:g.time+12};return ok;};
 // Known reachable resources under observed enemy weapons are not a safe
 // financing source for optional spending. Hidden enemy changes remain unknown.
 const visibleThreats=ctx.enemy||g.entities.filter(e=>e.hp>0&&g.hostile(p.id,e.owner)&&g.visible(p.id,e)&&g.detectable(p.id,e)),remembered=Array.isArray(ctx.knownEnemies)?ctx.knownEnemies:[];
 const threats=(config.recoveryCoordination||p.aiState?.recovery?.stalled?[...visibleThreats,...remembered.filter(e=>g.time-(e.seenAt??-999)<18)]:[]).filter(e=>{const d=definition(e);return d?.damage>0&&!d.worker&&!d.concealedTrap;});
 const hostileBases=config.recoveryCoordination?Object.values(p.knowledge||{}).filter(e=>e.kind==='building'&&e.hp>0&&g.hostile(p.id,e.owner)&&['hq','inf','armor','air','elite','defense'].includes(definition(e)?.kind)):[];
 const safeSupply=n=>!threats.some(e=>distance(e,n)<(definition(e).range||1)+5)&&!hostileBases.some(b=>distance(b,n)<12);
 const accessible=nodes.filter(n=>safeSupply(n)&&reachable(n)),remaining=D.resources.map((_,r)=>accessible.filter(n=>n.resource===r).reduce((sum,n)=>sum+n.amount,0));
 const supply=[...accessible,...exhausted.filter(reachable)],mineResources=[];
 let tradeInstead=false;
 // A shaft cannot be built across a cliff. Inspect remembered terrain only;
 // an unexplored footprint is uncertain, not proof that a mine is impossible.
 const mineTerrainPossible=(d,n)=>{for(const radius of [0,.35,.7])for(let k=0;k<(radius?16:1);k++){
  const x=n.x+Math.cos(k*Math.PI/8)*radius,y=n.y+Math.sin(k*Math.PI/8)*radius,reason=g.constructionTerrain(p.id,x,y,d.size);
  if(!reason)return true;if(reason!=='Explore the entire building site first')continue;
  // Partial fog does not erase a cliff already seen inside the footprint.
  const center=Math.floor(y)*g.n+Math.floor(x),height=p.explored[center]?p.knownTiles[center]&127:null;let impossible=false,min=Infinity,max=-Infinity;
  for(let iy=Math.floor(y-d.size);iy<=Math.floor(y+d.size-1e-7);iy++)for(let ix=Math.floor(x-d.size);ix<=Math.floor(x+d.size-1e-7);ix++){
   if(ix<0||iy<0||ix>=g.n||iy>=g.n){impossible=true;continue;}const i=iy*g.n+ix;if(!p.explored[i])continue;const h=p.knownTiles[i]&127;min=Math.min(min,h);max=Math.max(max,h);if(p.knownTiles[i]&128||g.rockTerrain(h)||height!==null&&Math.abs(h-height)>1)impossible=true;
  }
  if(!impossible&&max-min<=2)return true;
 }return false;};
 p.aiRenewableTargets||=[];if(workers.length&&g.time>20&&!firstIncome)for(const r of [0,1,2,3]){if(supply.some(n=>n.resource===r)&&remaining[r]<(r===0?3500:r===1?1200:500)&&!p.aiRenewableTargets.includes(r))p.aiRenewableTargets.push(r);if(p.aiRenewableTargets.includes(r)&&!own.some(b=>b.type===f.id+'_deep_'+D.resources[r])){if(config.recoveryCoordination&&r>0&&mineResources.includes(0))continue;const sites=supply.filter(n=>n.resource===r),d=D.buildings[f.id+'_deep_'+D.resources[r]];if(config.recoveryCoordination&&sites.length&&sites.every(n=>!mineTerrainPossible(d,n))){tradeInstead=true;continue;}mineResources.push(r);add(d.id);}}
 // Oil cannot be gathered without a collection facility; reserve that prerequisite too.
 // Each resource is delivered only to its own collector: a plan that spends Oil, Aetherite or Rift
 // Crystals includes that resource's collector when none stands yet.
 for(let r=1;r<4;r++){const spends=[...need.values()].some(d=>d.cost[r]>0);if((r===1?need.size:spends)&&remaining[r]>0&&!own.some(b=>['extractor','deepMine'].includes(definition(b)?.kind)&&definition(b)?.resource===D.resources[r]))add(f.buildings.find(b=>b.kind==='extractor'&&b.resource===D.resources[r])?.id);}
 const maritime=['rivers','narrows','continental','small-islands','large-islands','mediterranean','coastal'].includes(g.options.layout);
 const relocation=maritime&&remaining[0]<1800&&(config.macroForecast?own.filter(e=>e.kind==='unit'&&definition(e)?.worker).length:workers.length)>=4&&(!config.macroForecast||!firstIncome||g.time>60&&!own.some(b=>definition(b)?.kind==='extractor'&&definition(b)?.resource==='ore')||p.aiState?.recovery?.stalled);
 if(relocation&&!own.some(u=>definition(u)?.transport)){add(f.id+'_transport_ship');if(!(ctx.config?.recoveryCoordination||g.options.startingResources===false)||p.stock[1]<(D.units[f.id+'_transport_ship']?.cost[1]||0))add(f.buildings.find(b=>b.kind==='extractor'&&b.resource==='oil')?.id);}
 const outpost=p.aiLogistics?.expansion||p.aiLogistics?.lastExpansion,depot=outpost?.depot&&D.buildings[outpost.depot],site=outpost?.landing||outpost,needsDepot=depot&&!own.some(b=>b.kind==='building'&&['hq','depot','extractor'].includes(definition(b)?.kind)&&distance(b,site)<10);
 if(needsDepot)for(const req of depot.requires||[])add(req);
 const tradeMarket=D.buildings[f.id+'_market'],tradeUnit=D.units[f.id+'_merchant'];
 const missingRare=(config.recoveryCoordination&&g.time<=120?[0]:config.recoveryCoordination?[0,1,2,3]:[1,2,3]).some(r=>[...need.values()].reduce((sum,d)=>sum+d.cost[r],0)>p.stock[r]+remaining[r]);
 const tradeRecovery=!!(!firstIncome&&(config.recoveryCoordination||p.aiState?.recovery?.stalled)&&g.time>(config.recoveryCoordination?20:120)&&workers.length>=1&&(missingRare||tradeInstead)&&tradeMarket&&tradeUnit);let extraMarket=null;
 if(tradeRecovery){const markets=own.filter(e=>e.type===tradeMarket.id);if(markets.length<2){add(tradeMarket.id);need.set(tradeMarket.id,tradeMarket);if(!markets.length)extraMarket=tradeMarket;}if(!own.some(e=>e.type===tradeUnit.id)&&!pending(tradeUnit.id))add(tradeUnit.id);}
 let tradeFirst=null;if(tradeRecovery&&config.recoveryCoordination&&(own.filter(e=>e.type===tradeMarket.id&&e.progress>=1).length<2||!own.some(e=>e.type===tradeUnit.id))){const allowed=new Set();const allow=id=>{if(!id||allowed.has(id))return;allowed.add(id);const d=D.buildings[id]||D.units[id]||D.research[id];if(!d)return;for(const req of d.requires||[])allow(req);allow(d.research);if(D.units[id]||D.research[id])allow(d.building);};allow(tradeMarket.id);allow(tradeUnit.id);const house=f.buildings.find(b=>b.kind==='house');if(house&&g.capacity(p.id)-g.population(p.id)<(tradeUnit.pop||1)&&!own.some(b=>b.type===house.id&&b.progress<1)){allow(house.id);need.set(house.id,house);}tradeFirst=[...allowed];}
 // A distant deposit is not useful income until its collection point is paid.
 // Fund that physical expansion as part of the survival chain before luxuries.
 let collectionRecovery=false;
 if(config.recoveryCoordination&&workers.length>=2){
  const serves=(b,r)=>{const d=definition(b);return b?.kind==='building'&&!!d&&(d.kind==='hq'?r===0:(d.kind==='extractor'||d.kind==='deepMine')&&d.resource===D.resources[r]);},drops=own.filter(e=>e.kind==='building'&&e.progress>=1&&serves(e,0));
  const localOre=accessible.filter(n=>n.resource===0&&drops.some(b=>distance(b,n)<13)).reduce((sum,n)=>sum+n.amount,0);
  const depot=f.buildings.find(d=>d.kind==='extractor'&&d.resource==='ore');
  if(localOre<350&&depot&&accessible.some(n=>n.resource===0&&n.amount>180&&!own.some(b=>serves(b,0)&&distance(b,n)<13))){need.set(depot.id,depot);collectionRecovery=true;if(tradeFirst&&!tradeFirst.includes(depot.id))tradeFirst.push(depot.id);}
 }
 const cost=[0,0,0,0];for(const d of need.values())d.cost.forEach((v,i)=>cost[i]+=v);if(extraMarket)extraMarket.cost.forEach((v,i)=>cost[i]+=v);
 if(needsDepot){if(!config.macroForecast||!need.has(depot.id))depot.cost.forEach((v,i)=>cost[i]+=v);need.set(depot.id,depot);}
 const plan={cost,ids:[...need.keys()],remaining,resources:mineResources,relocation,critical:need.size>0&&remaining[0]<cost[0]+600,at:g.time};if(config.recoveryCoordination){plan.resourceWise=true;const serving=(b,r)=>{const d=definition(b);return b?.kind==='building'&&!!d&&(d.kind==='hq'?r===0:(d.kind==='extractor'||d.kind==='deepMine')&&d.resource===D.resources[r]);},drops=own.filter(e=>e.kind==='building'&&e.progress>=1);plan.liquidRemaining=D.resources.map((_,r)=>accessible.filter(n=>n.resource===r&&drops.some(b=>serving(b,r)&&distance(b,n)<18)).reduce((sum,n)=>sum+n.amount,0));}if(collectionRecovery)plan.collectionRecovery=true;if(tradeRecovery)plan.tradeRecovery=true;if(tradeFirst)plan.tradeFirst=tradeFirst;if(firstIncome||g.options.startingResources===false&&(p.gathered?.[0]||0)<1&&remaining[0]===0)plan.bootstrap=true;p.aiSustainability=plan;p.aiReserve=cost.map((v,i)=>Math.max(v,p.aiReserve?.[i]||0));return plan;
}
function protectedSpend(p,d){const plan=p.aiSustainability;if(!plan)return true;if(plan.tradeFirst&&!plan.tradeFirst.includes(d.id)&&!d.cost.every((v,i)=>v===0||p.stock[i]-v>=(plan.cost[i]||0)))return false;if(plan.bootstrap&&!plan.ids.includes(d.id))return false;return plan.ids.includes(d.id)||d.cost.every((v,i)=>plan.resourceWise&&v===0||p.stock[i]-v>=(plan.cost[i]||0));}
// Preserve private, already explored routes when planning a new foundation.
function keepsRoutes(g,p,d,point,probe,goals,baseRoutes){
 const cells=new Set(),radius=d.size*(22*1.6/48)+.10;
 for(let y=Math.max(0,Math.floor(point.y-d.size));y<=Math.min(g.n-1,Math.floor(point.y+d.size));y++)for(let x=Math.max(0,Math.floor(point.x-d.size));x<=Math.min(g.n-1,Math.floor(point.x+d.size));x++)if(Math.abs(x+.5-point.x)<radius&&Math.abs(y+.5-point.y)<radius)cells.add(y*g.n+x);
 const affected=[];for(const q of goals){const route=baseRoutes?.get(q)||g.path(probe,q,true),end=route.at(-1);if(end&&!cells.has(Math.floor(end.y)*g.n+Math.floor(end.x))&&distance(end,q)<2&&route.some(v=>cells.has(Math.floor(v.y)*g.n+Math.floor(v.x))))affected.push(end);}
 if(!affected.length)return true;const original=p.knownNav,cache=g.pathCache;p.knownNav=original.slice();for(const i of cells)p.knownNav[i]=1;g.pathCache=new Map();
 try{return affected.every(q=>distance(g.path(probe,q,true).at(-1)||probe,q)<1.5);}finally{p.knownNav=original;g.pathCache=cache;}
}
// Only private income and actual work count as economic progress. Moving in circles
// must not keep a failed plan alive; a long, moving voyage must not be cancelled.
function recover(g,p,ctx){
 const own=ctx.own||[],state=p.aiState||(p.aiState={}),r=state.recovery||(state.recovery={lastProgress:g.time,next:0,workers:{}});
 if(g.time<r.next)return;r.next=g.time+10;
 const income=(p.gathered||[]).reduce((a,b)=>a+b,0)+own.reduce((n,e)=>n+(e.tradeEarned||0),0);
 const work=own.filter(e=>e.kind==='building').map(e=>[e.id,Math.floor((e.progress||0)*100),...(e.queue||[]).map(q=>q.type+':'+Math.floor(q.remaining))]);
 const signature=JSON.stringify([p.tech,work]);
 if(r.income===undefined||income>r.income+.5||signature!==r.work)r.lastProgress=g.time;
 r.income=income;r.work=signature;r.stalled=g.time-r.lastProgress>=75;
 const ids=new Set();for(const u of own.filter(e=>e.kind==='unit'&&definition(e)?.worker)){
  ids.add(u.id);const key=JSON.stringify(u.order||null),old=r.workers[u.id];
  if(!old||old.key!==key||distance(old,u)>.6||Math.abs(old.carry-(u.carry||0))>.4){r.workers[u.id]={key,x:u.x,y:u.y,carry:u.carry||0,at:g.time};continue;}
  if(!r.stalled||g.time-old.at<35||u.aiLogistics||u.embarkedBy||u.aiScoutUntil>g.time||u.carry>0||u.order?.kind==='extract'||!u.order)continue;
  if(['move','gather','build','repair'].includes(u.order.kind)){g.order([u.id],{kind:'stop'});delete state.economy?.workers?.[u.id];old.at=g.time;}
 }
 for(const id of Object.keys(r.workers))if(!ids.has(Number(id)))delete r.workers[id];
 if(r.stalled&&g.time>=(r.retryAt||0)){
  r.retryAt=g.time+30;r.retries=(r.retries||0)+1;p.aiSupplyRoutes={};
  if(state.economy){state.economy.routes={};state.economy.failedSites={};state.economy.goal=null;}
  state.scoutVisited={};if(p.aiLogistics&&!p.aiLogistics.expansion&&!p.aiLogistics.sortie)p.aiLogistics.nextExpansion=0;
 }
}
// Rank normal paid upgrades by their benefit to the field army.
function upgradePriority(config,research,army,enemies,fallback){
 if(!config.macroForecast||!research||army.length<7)return fallback;
 const cost=d=>(d.cost||[]).reduce((sum,v,i)=>sum+v*[1,1.2,1.5,2][i],0);
 const force=army.filter(d=>d.damage>0),investment=force.reduce((n,d)=>n+cost(d),0);
 const incoming=enemies.filter(d=>d.damage>0),average=incoming.length?incoming.reduce((n,d)=>n+d.damage,0)/incoming.length:20;
 const benefit=research.kind==='weapons'?.12:research.kind==='armor'?Math.min(.25,2/Math.max(8,average)):0;
 const threshold=Math.max(.75,1.5-(config.grade-4)*.12);
 return investment*benefit>=cost(research)*threshold?96:fallback;
}
function step(g,p,ctx={}){
 const f=ctx.f||D.factions[p.faction];if(!f||!g.order||!g.queue)return;
 const time=g.time||0,own=(ctx.own||g.entities.filter(e=>e.owner===p.id)).filter(alive);
 const workers=(ctx.workers||own.filter(e=>e.kind==='unit'&&definition(e)?.worker)).filter(w=>!w.aiLogistics&&!w.embarkedBy&&w.order?.kind!=='extract'),military=ctx.military||own.filter(e=>e.kind==='unit'&&!definition(e)?.worker);
 const buildings=(ctx.buildings||own.filter(e=>e.kind==='building')).filter(alive),ready=buildings.filter(b=>b.progress>=1),stock=p.stock,tech=p.tech||[];
 if(!workers.length&&!ready.some(b=>definition(b)?.kind==='hq'))return;
 const config=ctx.config||(root.FractureAI||(typeof require!=='undefined'?require('./ai.js'):null)).configuration(g,p),strategyTime=time/(config.techPace||1),difficulty=typeof ctx.difficulty==='string'?ctx.difficulty:g.options?.difficulty||'normal';
 const sustainable=sustainability(g,p,ctx);
 const deepWorkers=own.filter(e=>e.kind==='unit'&&definition(e)?.worker&&e.order?.kind==='extract').length;
 const workerLimit=config.workerTarget??config.workers??(difficulty==='hard'?16:difficulty==='easy'?9:13),armyLimit=config.maxMilitary??config.armyLimit??(difficulty==='hard'?64:difficulty==='easy'?30:48);
 const state=(p.aiState||(p.aiState={})).economy||((p.aiState).economy={});state.workers=state.workers||{};state.failedSites=state.failedSites||{};
 for(const id of Object.keys(state.workers))if(!workers.some(w=>w.id===Number(id)))delete state.workers[id];
 const seen=(ctx.enemy||g.entities.filter(e=>alive(e)&&g.hostile(p.id,e.owner)&&g.visible(p.id,e)&&g.detectable(p.id,e)));
 const memories=Array.isArray(ctx.knownEnemies)?ctx.knownEnemies:Object.values(ctx.knownEnemies||{});
 const observed=new Map(memories.filter(e=>time-(e.seenAt??time)<110).map(e=>[e.id??(e.type+':'+e.x+':'+e.y),e]));for(const e of seen)observed.set(e.id,e);
 const threats=[...seen,...memories.filter(e=>time-(e.seenAt??-999)<18)].filter(e=>{const d=definition(e);return d&&(d.damage>0&&!d.worker||d.kind==='defense');});
 const dangerous=(point,margin=4)=>threats.some(e=>distance(e,point)<(definition(e)?.range||5)+margin);
 const safeRoute=(a,b)=>!threats.some(e=>segmentDistance(e,a,b)<(definition(e)?.range||5)+2.8);
 const home=ready.find(b=>definition(b)?.kind==='hq')||p.home||workers[0]||buildings[0];if(!home)return;
 const localThreats=threats.filter(e=>distance(e,home)<14),incomeThreatened=config.macroForecast&&threats.some(e=>workers.some(w=>!(w.aiScoutUntil>time)&&['gather','returnCargo','extract'].includes(w.order?.kind)&&distance(w,e)<(definition(e)?.range||1)+5)||ready.some(b=>definition(b)?.kind==='extractor'&&distance(b,e)<12)),threatened=incomeThreatened||localThreats.length>=3||localThreats.reduce((n,e)=>n+(definition(e)?.damage||23),0)>=40;
 // Cache routes against private map knowledge; distant deposits on another island
 // cannot receive builders or gatherers until a transport establishes a foothold.
 state.routes||={};const probe=workers[0]||military.find(u=>!definition(u)?.air);
 function reachable(n){if(!probe)return false;const cached=state.routes[n.id],key=p.navigationRevision||0,anchors=workers.filter(w=>!w.aiLogistics).sort((a,b)=>distance(a,n)-distance(b,n)).slice(0,3),signature=anchors.map(w=>w.id+':'+Math.floor(w.x/8)+':'+Math.floor(w.y/8)).join(',');if(cached&&cached.until>time&&cached.signature===signature)return cached.ok;const ok=anchors.some(w=>{return g.knownRoute(w,g.approach(w,n,.7));});state.routes[n.id]={ok,key,signature,until:time+12};return ok;}
 function workerReaches(w,n){const key=w.id+':'+n.id,c=state.routes[key],signature=Math.floor(w.x/8)+':'+Math.floor(w.y/8),revision=p.navigationRevision||0;if(c&&c.until>time&&c.signature===signature)return c.ok;const q=g.approach(w,n,.7),reaches=g.knownRoute(w,q),route=reaches?g.path(w,q):[],ok=reaches&&distance(route.at(-1)||w,q)<2&&route.every(v=>p.explored[Math.floor(v.y)*g.n+Math.floor(v.x)]);state.routes[key]={ok,signature,revision,until:time+12};if(config.recoveryCoordination){let last=w,travel=0;for(const q of route){travel+=distance(last,q);last=q;}state.routes[key].travel=travel;}return ok;}
 const nodes=knownResources(g,p).sort((a,b)=>distance(home,a)-distance(home,b)).slice(0,48).filter(reachable),nodeById=new Map(nodes.map(n=>[n.id,n]));
 const serves=(b,r)=>{const d=definition(b);return b?.kind==='building'&&!!d&&(d.kind==='hq'?r===0:(d.kind==='extractor'||d.kind==='deepMine')&&d.resource===D.resources[r]);},drops=ready.filter(b=>['hq','extractor','deepMine'].includes(definition(b)?.kind));
 const queued=buildings.flatMap(b=>queueOf(b).filter(q=>q.kind==='unit').map(q=>D.units[q.type]).filter(Boolean));
 const armyDefs=[...military.map(definition),...queued.filter(d=>!d.worker&&!d.naval&&!d.transport&&d.role!=='merchant')].filter(Boolean),countRole=role=>armyDefs.filter(d=>d.role===role).length;
 const armySize=armyDefs.length,detectors=armyDefs.filter(d=>d.detector).length;
 const foes=[...observed.values()],foeUnits=foes.filter(e=>e.kind==='unit').map(definition).filter(d=>d&&!d.worker);
 const airCount=foeUnits.filter(d=>d.air).length,armorCount=foeUnits.filter(d=>d.armored||d.armor>=3).length,meleeCount=foeUnits.filter(d=>d.range<1.6).length;
 const fortCount=foes.filter(e=>e.kind==='building'&&definition(e)?.kind==='defense').length,stealthSeen=foeUnits.some(d=>d.stealth);
 const existingType=id=>buildings.filter(b=>b.type===id),hasReady=id=>ready.some(b=>b.type===id),queuedType=id=>buildings.some(b=>queueOf(b).some(q=>q.type===id));
 const islandWar=!!p.aiLogistics?.needsTransport;
 const roles={rifle:3+armySize*.29,melee:1+armySize*.13,aa:Math.max(armySize>=5?1:0,airCount*.75+armorCount*.35,armySize*.10),heavy:armySize>=5?1+armySize*.11:0,tank:armySize>=8?1+armySize*.10:0,siege:armySize>=7?Math.max(1,armySize*.12,fortCount*.8):0,support:armySize>=6?Math.max(1,armySize*.10):0,scout:Math.min(config.scouts||1,Math.max(1,Math.floor(armySize/12))),fighter:airCount?Math.min(4,airCount*.5):armySize>=20?1:0,gunship:armySize>=14?armySize*.09:0,elite:armySize>=16?armySize*.09:0,giant:armySize>=30?1:0,stealth:armySize>=15?1:0};
 if(islandWar){roles.gunship=Math.max(roles.gunship,8);roles.siege=Math.max(roles.siege,3);roles.fighter=Math.max(roles.fighter,airCount?4:0);}
 // Marginal composition value falls as a role is filled, including reserved queues.
 function evaluateUnit(u){
  if(u.naval||u.transport||u.role==='merchant')return -100;if(islandWar&&!u.air&&armyDefs.filter(d=>!d.air&&!d.worker).length>=24)return -100;
  if(u.worker||(u.special||0)>(p.special||0))return -100;
  const desired=roles[u.role]||0,count=countRole(u.role);let value=desired>0?26*(desired-count)/(desired+1):-16;
  if(u.detector&&detectors<(stealthSeen?2:1)&&(!config.macroForecast||stealthSeen||armySize>=4))value+=35;
  if(config.macroForecast&&u.role==='scout'&&!stealthSeen&&armyDefs.filter(d=>d.damage>0&&d.role!=='scout').length<2)value-=30;
  if(u.aa&&!u.airOnly&&airCount)value+=Math.min(14,airCount*3)/(1+armyDefs.filter(d=>d.aa&&!d.airOnly).length*.15);
  if(u.bonus==='armor'&&armorCount)value+=Math.min(12,armorCount*2)/(1+count*.3);
  if((u.splash||u.role==='heavy')&&meleeCount)value+=Math.min(9,meleeCount*1.5)/(1+count*.25);
  if(u.airOnly&&!airCount)value-=20;
  if(config.adaptiveEconomy&&C.category(u)==='breacher'){if(armySize<12)value-=35;else if(armyDefs.filter(d=>C.category(d)==='breacher').length>=Math.max(1,fortCount))value-=25;}
  // Match the real unit schema and combat multipliers, and discount counters
  // already recruited/queued. No invented antiAir/antiArmor role names.
  if(config.counterProduction&&ctx.knownEnemies?.length&&u.damage>0){
   value+=counterDemand(u,ctx.knownEnemies,armyDefs,time,config.adaptiveComposition);
  }
  if(u.role==='scout'&&count>=roles.scout)value-=35;
  if(u.role==='support'&&count>=roles.support)value-=30;
  if(u.range>=3&&u.damage>0&&!u.airOnly)value+=2;
  if(config.counterWeight&&foeUnits.length&&u.damage>0){const compatible=foeUnits.filter(t=>(!t.air||u.aa)&&(!u.airOnly||t.air));const matchup=compatible.reduce((n,t)=>n+C.multiplier(u,t),0)/foeUnits.length;value+=Math.max(-14,Math.min(18,(matchup-1)*18))*config.counterWeight;}
  if(config.forecastFire&&foeUnits.length&&u.damage>0&&!u.airOnly){const targets=foeUnits.filter(t=>(!t.air||u.aa)&&(!u.airOnly||t.air));const damage=targets.reduce((n,t)=>n+Math.max(1,u.damage*C.multiplier(u,t)-(t.armor||0)),0)/foeUnits.length;const valuePerCost=damage/(u.cooldown||1.25)*Math.sqrt(u.hp)/(u.cost[0]+u.cost[1]*1.2+u.cost[2]*1.5+u.cost[3]*2+20);value+=Math.min(16,valuePerCost*7)*config.counterWeight;}
  // Evaluate the next recruit against the enemy army we have actually seen.
  // Existing and queued counters reduce its marginal value, so several factories
  // do not all buy the same answer while leaving another threat uncovered.
  if(config.grade>=5&&foeUnits.length&&u.damage>0&&!u.airOnly){
   const efficiency=(a,t)=>{if(t.air&&!a.aa||a.airOnly&&!t.air)return 0;return Math.max(1,a.damage*C.multiplier(a,t)-(t.armor||0))/(a.cooldown||1.25)/(a.cost[0]+a.cost[1]*1.2+a.cost[2]*1.5+a.cost[3]*2+20);};
   let advantage=0;for(const target of foeUnits){const current=armyDefs.filter(a=>a.damage>0&&!a.airOnly),average=current.length?current.reduce((v,a)=>v+efficiency(a,target),0)/current.length:0,candidate=efficiency(u,target);if(average>0)advantage+=Math.max(-1,Math.min(2,candidate/average-1));}
   value+=advantage/foeUnits.length*(8+(config.grade-5)*4);
  }
  value-=Math.max(0,armyDefs.filter(d=>d.id===u.id).length-2)*.2;
  return value;
 }
 const unitValues=new Map();function unitValue(u){const key=u.id+':'+armyDefs.length+':'+p.special;if(!unitValues.has(key))unitValues.set(key,evaluateUnit(u));return unitValues.get(key);}
 const strategistPriorities=p.aiStrategistDecision?.expires>g.time?new Set(p.aiStrategistDecision.unitPriorities||[]):new Set();
 const unitOrder=f.units.filter(u=>!u.worker).map(u=>({u,value:unitValue(u)+(strategistPriorities.has(u.id)?18:0)})).sort((a,b)=>b.value-a.value||a.u.cost[0]-b.u.cost[0]);
 function canPlan(u){
  if(unitValue(u)<1)return false;
  // One useful field army and a productive branch come before a collection of empty factories.
  if(config.forecastFire&&!hasReady(u.building)&&armySize<20&&!islandWar&&!u.detector&&!(u.heal&&armySize>=8)&&!(airCount>0&&u.aa&&!u.airOnly)&&!(armorCount>=2&&u.bonus==='armor'&&armyDefs.filter(d=>d.bonus==='armor').length<Math.ceil(armorCount*.6))&&!(fortCount>=2&&u.role==='siege')&&D.buildings[u.building]?.kind!=='inf')return false;
  if(threatened&&armySize<5)return u.cost.slice(1).every(n=>!n)&&!u.research;
  if(u.detector&&detectors===0)return true;
  if(config.grade>=8&&armySize<6)return !u.requires?.length&&!u.extension&&!u.research;
  if(['elite','giant'].includes(u.role))return strategyTime>240&&armySize>=16;
  if(['fighter','gunship'].includes(u.role))return strategyTime>(airCount>2||islandWar?125:200)&&armySize>=(islandWar?6:9);
  if(['tank','siege'].includes(u.role))return strategyTime>95&&armySize>=6;
  if(u.role==='support')return strategyTime>85&&armySize>=5;
  return strategyTime>40||!u.requires?.length&&!u.extension;
 }
 // This returns the next paid action in an actual unit prerequisite chain.
 function buildingAction(id,priority,label,visiting=new Set()){
  if(existingType(id).length||visiting.has(id))return null;const b=D.buildings[id];if(!b)return null;visiting.add(id);
  for(const req of b.requires||[])if(D.buildings[req]&&!hasReady(req))return buildingAction(req,priority,label,visiting);else if(D.research[req]&&!tech.includes(req))return researchAction(req,priority);
  return{kind:'build',def:b,priority,label:label||b.name,key:'build:'+id};
 }
 function researchAction(id,priority){
  if(tech.includes(id)||queuedType(id))return null;const r=D.research[id];if(!r)return null;
  if(!hasReady(r.building))return buildingAction(r.building,priority,r.name);
  for(const req of r.requires||[])if(!tech.includes(req))return D.research[req]?researchAction(req,priority):buildingAction(req,priority,r.name);
  return{kind:'research',def:r,priority,key:'research:'+id};
 }
 function unlockAction(u,priority){
  if(!existingType(u.building).length)return buildingAction(u.building,priority,u.name);
  if(!hasReady(u.building))return null;
  for(const req of u.requires||[])if(D.buildings[req]?!hasReady(req):!tech.includes(req))return D.research[req]?researchAction(req,priority):buildingAction(req,priority,u.name);
  if(u.research&&!tech.includes(u.research))return researchAction(u.research,priority);
  if(u.extension){
   const bs=existingType(u.building);if(bs.some(b=>b.extension===u.extension||queueOf(b).some(q=>q.kind==='extension'&&D.extensions[q.type]?.name===u.extension)))return null;
   const free=bs.find(b=>b.progress>=1&&!b.extension&&!queueOf(b).some(q=>q.kind==='extension')&&(!g.extensionFits||g.extensionFits(b)));
   const ex=f.extensions.find(e=>e.building===u.building&&e.name===u.extension);
   if(free&&ex)for(const req of ex.requires||[])if(D.buildings[req]?!hasReady(req):!tech.includes(req))return D.research[req]?researchAction(req,priority):buildingAction(req,priority,u.name);
   if(free&&ex)return{kind:'extension',def:ex,building:free,priority,key:'extension:'+ex.id};
   // Mutually exclusive extensions need a separate physical production building.
   if(bs.every(b=>b.progress>=1)&&bs.length<Math.min(3,f.extensions.filter(e=>e.building===u.building).length+1)&&armySize>=10)return{kind:'build',def:D.buildings[u.building],priority:priority-3,key:'branch:'+u.building+':'+u.extension,label:u.extension,duplicate:true};
  }
  return null;
 }
 const priorities=[];function plan(a){if(a&&!priorities.some(b=>b.key===a.key))priorities.push(a);}
 const hqDef=f.buildings.find(b=>b.kind==='hq'),inf=f.buildings.find(b=>b.kind==='inf'),house=f.buildings.find(b=>b.kind==='house');
 if(!existingType(hqDef.id).length)plan(buildingAction(hqDef.id,130));
 if(!existingType(inf.id).length&&!sustainable.bootstrap)plan(buildingAction(inf.id,120));
 const capacity=g.capacity(p.id),population=g.population(p.id),pendingHouse=buildings.some(b=>definition(b)?.kind==='house'&&b.progress<1);
 const wavePopulation=config.macroForecast?Math.min(22,ready.filter(b=>['inf','counter','armor','air','elite'].includes(definition(b)?.kind)).length*3+(workers.length<workerLimit?3:0)):0;
 if(capacity<200&&capacity-population<Math.max(wavePopulation,5,Math.min(12,armySize*.25+3))&&!pendingHouse)plan({kind:'build',def:house,priority:capacity-population<2?125:105,key:'house'});
 const oilNodes=nodes.filter(n=>n.resource===1&&!dangerous(n,5)),needOil=!(config.recoveryCoordination&&sustainable.bootstrap)&&stock[1]<100&&(armySize>=3||strategyTime>65)&&!buildings.some(b=>definition(b)?.resource==='oil'&&oilNodes.some(n=>distance(b,n)<6));
 if(needOil){const oil=oilNodes.filter(n=>!buildings.some(b=>definition(b)?.resource==='oil'&&distance(b,n)<6)).sort((a,b)=>distance(a,home)-distance(b,home))[0];if(oil)plan({kind:'build',def:f.buildings.find(b=>b.resource==='oil'),near:oil,priority:sustainable.ids.includes(f.buildings.find(b=>b.resource==='oil')?.id)?132:stock[1]<60?119:70,key:'oil:'+oil.id});}
 if(p.aiLogistics?.transportWanted){
  const u=D.units[p.aiLogistics.transportWanted],transportPriority=sustainable.relocation?131:114;
  if(u&&!own.some(e=>e.type===u.id)&&!queuedType(u.id)){
   const next=unlockAction(u,transportPriority);if(next)plan(next);
   else if(hasReady(u.building)&&!g.missing(p.id,u,ready.find(b=>b.type===u.building)).length)plan({kind:'unit',def:u,priority:transportPriority,key:'transport:'+u.id});
  }
 }else if(p.aiLogistics?.needAirTransport)plan(unlockAction(D.units[f.id+'_air_transport'],109));
 if(strategyTime>65&&armySize>=(config.grade>=8?6:4))plan(buildingAction(f.buildings.find(b=>b.kind==='lab').id,68));
 for(const {u,value}of unitOrder)if(canPlan(u)){const urgentAir=config.forecastFire&&airCount>0&&u.role==='aa'&&countRole('aa')<Math.max(1,Math.ceil(airCount*.75)),urgentArmor=config.forecastFire&&armorCount>=2&&u.bonus==='armor'&&armyDefs.filter(d=>d.bonus==='armor').length<Math.ceil(armorCount*.6);plan(unlockAction(u,urgentAir?108:urgentArmor?99:u.detector&&!detectors?88:47+value*.6));}
 const strategistResearch=p.aiStrategistDecision?.expires>g.time?new Set(p.aiStrategistDecision.researchPriorities||[]):new Set();
 for(const id of strategistResearch)plan(researchAction(id,106));
 if(strategyTime>115&&workers.length>=9&&!threatened)plan(researchAction(f.id+'_economy',config.grade>=7&&workers.length>=12&&armySize>=3?92:69));
 if((strategyTime>130||config.techRush&&strategyTime>95)&&armySize>=7){plan(researchAction(f.id+'_weapons1',upgradePriority(config,D.research[f.id+'_weapons1'],military.map(definition),foeUnits,62)+(config.techRush?12:0)));if(strategyTime>175)plan(researchAction(f.id+'_armor1',upgradePriority(config,D.research[f.id+'_armor1'],military.map(definition),foeUnits,54)));}
 if(strategyTime>270&&armySize>=18&&!threatened){plan(researchAction(f.id+'_weapons2',upgradePriority(config,D.research[f.id+'_weapons2'],military.map(definition),foeUnits,43)));plan(researchAction(f.id+'_armor2',upgradePriority(config,D.research[f.id+'_armor2'],military.map(definition),foeUnits,40)));}
 // Branch upgrades are only purchased for branches that are actually fielding units.
 if(strategyTime>230&&armySize>=15&&!threatened)for(const b of ready)if(armyDefs.filter(u=>u.building===b.type).length>=5)plan(researchAction(b.type+'_specialization',config.macroForecast&&ready.filter(v=>v.type===b.type&&queueOf(v).length).length>=2?95:39));
 if(strategyTime>135&&armySize>=7&&!buildings.some(b=>definition(b)?.kind==='defense')&&(threatened||stock[0]>350))plan(buildingAction(f.buildings.find(b=>b.kind==='defense').id,threatened?84:35));
  // Choke-point fortification: higher-grade AIs identify narrow map passages and fortify them
  if(config.chokePointTowers&&strategyTime>200&&armySize>=12&&stock[0]>400&&(!threatened||p.aiStrategistFortifyUntil>g.time)){
   const chokePoints=findChokePoints(g,p,config);
   const trapDef=f.buildings.find(b=>b.kind==='trap');
   const wallDef=f.buildings.find(b=>b.kind==='wall');
   // Towers cover approaches; route preservation prevents sealing the AI inside.
   const towerDef=f.buildings.find(b=>b.kind==='defense');
   for(const cp of chokePoints.slice(0,config.fullMapControl?3:config.chokePointTraps?2:1)){
    // Build a defense tower at the choke point
    if(towerDef&&!buildings.some(b=>definition(b)?.kind==='defense'&&distance(b,cp)<8)){
     const err=g.placement(towerDef.id,p.id,cp.x,cp.y,false);
     if(!err)plan({kind:'build',def:towerDef,near:cp,priority:66,key:'choke-tower:'+Math.round(cp.x)+','+Math.round(cp.y)});
    }
    // A defense line uses two wall segments beside the known passage instead of
    // sealing its center. keepsRoutes() below rejects any site that would trap
    // workers or close the AI's only route; the clear middle remains the gate lane.
    if(wallDef&&config.fortifyApproaches){
     const dx=cp.x-home.x,dy=cp.y-home.y,len=Math.hypot(dx,dy)||1,perp={x:-dy/len,y:dx/len};
     for(const side of [-1,1]){
      const q={x:Math.round(cp.x+perp.x*2.1*side)+.5,y:Math.round(cp.y+perp.y*2.1*side)+.5};
      if(q.x<=1||q.y<=1||q.x>=g.n-1||q.y>=g.n-1||!g.known(p.id,q)||buildings.some(b=>definition(b)?.kind==='wall'&&distance(b,q)<1.1))continue;
      if(!g.placement(wallDef.id,p.id,q.x,q.y,false))plan({kind:'build',def:wallDef,near:q,exact:true,priority:58,key:'choke-wall:'+Math.round(q.x)+','+Math.round(q.y)});
     }
    }
    // Mine the approach with traps
    if(trapDef&&config.chokePointTraps&&!buildings.some(b=>definition(b)?.kind==='trap'&&distance(b,cp)<6)){
     for(const offset of [{dx:-2,dy:0},{dx:2,dy:0},{dx:0,dy:-2},{dx:0,dy:2}]){
      const tx=cp.x+offset.dx,ty=cp.y+offset.dy;
      if(tx>0&&ty>0&&tx<g.n&&ty<g.n&&g.known(p.id,{x:tx,y:ty})&&!g.blocked(tx,ty,false,p.id)){
       const err=g.placement(trapDef.id,p.id,tx,ty,false);
       if(!err){plan({kind:'build',def:trapDef,near:{x:tx,y:ty},exact:true,priority:74,key:'choke-trap:'+Math.round(tx)+','+Math.round(ty)});break;}
      }
     }
    }
   }
  }
 // Scale renewable income with the paid workforce instead of staffing one shaft
 // forever while extra workers and production buildings wait for Ore.
 const oreMines=ready.filter(b=>b.type===f.id+'_deep_ore'),mineGoal=config.adaptiveEconomy?Math.min(4,Math.floor((workers.length+deepWorkers)/10)):1;
 if(config.adaptiveEconomy&&!threatened&&armySize>=8&&tech.includes(f.id+'_deep_extraction')&&sustainable.remaining[0]<600&&oreMines.length>0&&oreMines.length<mineGoal&&!buildings.some(b=>b.type===f.id+'_deep_ore'&&b.progress<1||queueOf(b).some(q=>q.type===f.id+'_deepen_ore'))){
  // A further shaft is an upgraded Ore collector on a spent deposit: upgrade one that stands there,
  // or claim a spent node with a collector first.
  const up=D.extensions[f.id+'_deepen_ore'],collector=f.buildings.find(b=>b.kind==='extractor'&&b.resource==='ore'),spent=b=>!g.entities.some(e=>e.kind==='resource'&&e.resource===0&&e.amount>0&&distance(e,b)<1.6);
  const site=up&&ready.find(b=>b.type===collector?.id&&queueOf(b).length===0&&!dangerous(b,5)&&spent(b));
  if(site)plan({kind:'extension',def:up,building:site,priority:103,key:'deep-capacity:'+site.id});
  else if(collector&&!buildings.some(b=>b.type===collector.id&&b.progress<1&&spent(b))){const n=Object.values(p.knowledge||{}).filter(n=>n.kind==='resource'&&n.resource===0&&n.amount<=0&&!dangerous(n,5)&&reachable(n)&&!g.placement(collector.id,p.id,n.x,n.y,false,null,true)).sort((a,b)=>distance(a,home)-distance(b,home))[0];if(n)plan({kind:'build',def:collector,near:n,exact:true,priority:103,key:'deep-capacity:'+n.id});}
 }
 // Expand for remaining deposits and long delivery trips; no idle-worker trigger is needed.
 const safeNodes=nodes.filter(n=>!dangerous(n,5)&&safeRoute(home,n));
 const oreLeft=safeNodes.filter(n=>n.resource===0&&distance(n,home)<13).reduce((n,e)=>n+e.amount,0);
 // Secure a sustainable source before spending the last finite deposit. Research
 // follows each faction's real prerequisites and the mine is built only on depletion.
 const remaining=safeNodes.filter(n=>n.resource===0).reduce((n,e)=>n+e.amount,0),deepId=f.id+'_deep_ore',deepTech=f.id+'_deep_extraction';
 const exhausted=Object.values(p.knowledge||{}).filter(e=>e.kind==='resource'&&e.resource===0&&e.amount<=0&&!dangerous(e,5)&&reachable(e));
 for(const r of sustainable.resources){
  const id=f.id+'_deep_'+D.resources[r],priority=sustainable.critical?128:116;
  if(!tech.includes(deepTech))plan(researchAction(deepTech,priority));
  else{
   // Deep mines come from upgrading a collector that stands on a spent deposit; with none in place,
   // first claim a spent node with a collector, then upgrade it.
   const up=Object.values(D.extensions).find(x=>x.upgradeTo===id),collector=f.buildings.find(b=>b.kind==='extractor'&&b.resource===D.resources[r]),spent=b=>!g.entities.some(e=>e.kind==='resource'&&e.resource===r&&e.amount>0&&distance(e,b)<1.6);
   const site=up&&ready.find(b=>b.type===collector?.id&&queueOf(b).length===0&&!dangerous(b,5)&&spent(b));
   if(site)plan({kind:'extension',def:up,building:site,priority:priority+1,key:'deep:'+site.id});
   else{const n=collector&&Object.values(p.knowledge||{}).find(n=>n.kind==='resource'&&n.resource===r&&n.amount<=0&&!dangerous(n,5)&&reachable(n)&&!g.placement(collector.id,p.id,n.x,n.y,false,null,true));if(n)plan({kind:'build',def:collector,near:n,exact:true,priority:priority+1,key:'deep:'+n.id});}
  }
 }

 if((strategyTime>(config.expansionAt??110)&&workers.length>=(config.expansionWorkers??9)||config.recoveryCoordination&&sustainable.collectionRecovery)&&!threatened){
  // Collection capacity is a competence, not a bonus: stronger controllers charter and pay for
  // more collection sites per resource and can hold several foundations in flight at once.
  // Each resource is delivered only to its own collector, so the first collector for Oil, Aetherite and
  // Rift Crystals is a basic requirement, not an expansion: claim the nearest safe deposit of each.
  for(let r=1;r<4;r++){if(buildings.some(b=>serves(b,r)))continue;const n=safeNodes.filter(n=>n.resource===r&&n.amount>0).sort((a,b)=>distance(a,home)-distance(b,home))[0],d=n&&f.buildings.find(b=>b.kind==='extractor'&&b.resource===D.resources[r]);if(d)plan({kind:'build',def:d,near:n,priority:r===1?103:r===2?102:101,key:'collector:'+r});}
  const siteCap=config.expansionLimit??3,inFlight=config.expansionSites??1;
  const candidates=safeNodes.filter(n=>n.amount>180&&(n.resource===0||stock[n.resource]<60)&&buildings.filter(b=>definition(b)?.resource===D.resources[n.resource]&&definition(b)?.kind==='extractor').length<siteCap&&!buildings.some(b=>serves(b,n.resource)&&distance(b,n)<7)).map(n=>({n,score:(n.resource===0?12:3)+(oreLeft<500&&n.resource===0?15:0)-distance(n,home)*.25})).sort((a,b)=>b.score-a.score);
  const picks=[];for(const c of candidates){if(picks.length>=inFlight)break;if(picks.some(q=>distance(q.n,c.n)<7))continue;picks.push(c);}
  for(const expansion of picks)if(oreLeft<650||stock[0]>260||expansion.n.resource===0&&drops.filter(b=>serves(b,0)).every(b=>distance(b,expansion.n)>13)){const n=expansion.n,d=f.buildings.find(b=>b.resource===D.resources[n.resource]);plan({kind:'build',def:d,near:n,priority:config.recoveryCoordination&&sustainable.ids.includes(d.id)?133:oreLeft<350?82:45,key:'expansion:'+n.id});}
 }
 // Add capacity only when a useful branch is actually saturated and income supports it.
 // If repeated attacks have failed, urgently expand production
  if(config.emergencyProduction&&p.aiState?.attackHistory){
   const rH=p.aiState.attackHistory.filter(a=>g.time-a.time<300);
   if(rH.filter(a=>a.result==='retreat').length>=2&&!rH.some(a=>a.result==='success')&&armySize<armyLimit&&stock[0]>180){
    const b2=ready.find(b=>queueOf(b).some(q=>q.kind==='unit'&&!D.units[q.type]?.worker)&&existingType(b.type).length<(config.productionLimit||2)&&f.units.some(u=>u.building===b.type&&unitValue(u)>5));
    if(b2)plan({kind:'build',def:D.buildings[b2.type],priority:98,key:'recovery-capacity:'+b2.type,duplicate:true});}}
  if(strategyTime>150&&armySize<armyLimit&&stock[0]>(config.adaptiveEconomy?220:350)&&!threatened){const b=ready.find(b=>queueOf(b).some(q=>q.kind==='unit'&&!D.units[q.type]?.worker)&&existingType(b.type).length<(config.productionLimit||2)&&(config.grade<9||existingType(b.type).every(other=>other.progress>=1&&queueOf(other).some(q=>q.kind==='unit'&&!D.units[q.type]?.worker)))&&f.units.some(u=>u.building===b.type&&unitValue(u)>5));if(b)plan({kind:'build',def:D.buildings[b.type],priority:config.adaptiveEconomy?94:32,key:'capacity:'+b.type,duplicate:true});}
 // A population-blocked transport must not hold housing and drilling hostage.
 for(let i=priorities.length-1;i>=0;i--)if(priorities[i].kind==='unit'&&g.population(p.id)+(priorities[i].def.pop||1)>g.capacity(p.id))priorities.splice(i,1);
 priorities.sort((a,b)=>b.priority-a.priority);
 // A future investment is still a plan when its last few Ore have not arrived.
 // Reserve it alongside drilling, but only if known income can actually fund it.
 function fundable(d){return config.macroForecast&&!sustainable.bootstrap&&(!sustainable.tradeFirst||sustainable.tradeFirst.includes(d.id))&&d.cost.every((v,i)=>v+(sustainable.ids.includes(d.id)?0:sustainable.cost[i])<=stock[i]+sustainable.remaining[i]||own.some(b=>b.type===f.id+'_deep_'+D.resources[i]&&b.progress>=1&&b.lastExtraction>time-30));}
 for(let i=priorities.length-1;i>=0;i--)if(!protectedSpend(p,priorities[i].def)&&!fundable(priorities[i].def)&&(sustainable.bootstrap||sustainable.tradeFirst||!(['hq','inf'].includes(priorities[i].def.kind)&&(!config.recoveryCoordination||!existingType(priorities[i].def.id).length))))priorities.splice(i,1);
 // Hold a small, stable investment goal until it is paid or becomes irrelevant.
 let action=priorities.find(a=>(state.failedSites[a.key]||0)<=time);
 const prior=priorities.find(a=>a.key===state.goal&&a.priority>=45&&(state.failedSites[a.key]||0)<=time);
 if(prior&&action&&action.priority<100&&prior.priority>=action.priority-8&&time-(state.goalAt||0)<40)action=prior;
 // Keep a paid reinforcement cycle available before optional buildings or research.
 const readyChoices=unitOrder.filter(({u,value})=>value>0&&ready.some(b=>b.type===u.building&&!g.missing(p.id,u,b).length));
 const combatBudget=config.adaptiveEconomy?readyChoices.filter(({u})=>u.damage>0&&!u.airOnly).slice(0,2).reduce((n,{u})=>n+u.cost[0],0)*config.investmentBuffer:0;
 const rebuildingArmy=armySize<Math.max(10,Math.min(28,workers.length*1.15),Math.min(32,foeUnits.length*1.2));
 // A weapon/armor upgrade benefits the army already on the field. Do not postpone
 // it forever while replacing casualties; reserve just one affordable reinforcement.
 const improvesArmy=config.forecastFire&&action?.kind==='research'&&['weapons','armor'].includes(action.def.kind)&&armySize>=8;
 const investmentFloor=improvesArmy||config.adaptiveEconomy&&action?.key.startsWith('capacity:')?Math.min(...readyChoices.filter(({u})=>u.damage>0&&!u.airOnly).map(({u})=>u.cost[0]),combatBudget):combatBudget;
 if(config.adaptiveEconomy&&action&&action.priority<100&&rebuildingArmy&&stock[0]-action.def.cost[0]<investmentFloor&&!(config.macroForecast&&!threatened&&armySize>=12&&fundable(action.def)))action=null;
 if(action?.key!==state.goal){state.goal=action?.key||null;state.goalAt=time;}
 state.goalCost=action?.def?.cost||[0,0,0,0];
 function freeWorker(w){if(w.aiLogistics||w.embarkedBy||w.order?.kind==='extract')return false;const s=state.workers[w.id]||{};return w.aiScoutUntil<=time||!w.aiScoutUntil?!dangerous(w,2)&&!(s.fleeUntil>time)&&!['build','repair'].includes(w.order?.kind):false;}
 function builder(near){return workers.filter(freeWorker).filter(w=>safeRoute(w,near)).sort((a,b)=>(a.carry||0)*2+distance(a,near)-(b.carry||0)*2-distance(b,near))[0];}
 function buildAction(a){
  if(!a.def||g.missing(p.id,a.def).length||!g.affordable(p.id,a.def.cost))return false;
  let near=a.near||home,w=builder(near);
  // A raider over the headquarters must not veto safe construction elsewhere.
  // Keep resource-specific projects fixed to their deposit; ordinary buildings
  // may use a known safe worker/outpost as their construction anchor.
  if(config.recoveryCoordination&&!a.near&&(!w||dangerous(near,3))){
   const shelters=[...ready,...workers].filter(q=>!dangerous(q,4)).sort((a,b)=>distance(a,home)-distance(b,home));
   for(const q of shelters){const candidate=builder(q);if(candidate){near=q;w=candidate;break;}}
  }
  if(!w||dangerous(near,3))return false;
  // An exact known site (a remembered spent deposit) can be founded from knowledge, like the old
  // direct deep-mine order; other projects first send a worker to look.
  if(a.near&&!a.exact&&!g.visible(p.id,a.near)){
   const s=state.workers[w.id]||(state.workers[w.id]={});if(s.project!==a.key){g.order([w.id],{kind:'move',x:near.x,y:near.y});s.project=a.key;s.projectUntil=time+25;}return false;
  }
  const anchors=a.near?[a.near]:[near,...drops.filter(b=>distance(b,near)>10&&safeRoute(near,b))];
  const routeGoals=[],baseRoutes=new Map();if(config.recoveryCoordination){for(const radius of [8,14,22])for(let k=0;k<8;k++){const q={x:Math.floor(home.x+Math.cos(k*Math.PI/4)*radius)+.5,y:Math.floor(home.y+Math.sin(k*Math.PI/4)*radius)+.5};if(g.known(p.id,q)&&!g.blocked(q.x,q.y,false,p.id))routeGoals.push(q);}routeGoals.push(...workers.filter(v=>v.id!==w.id).slice(0,6),...nodes.slice(0,8).map(n=>g.approach(w,n,.7)));for(const q of routeGoals)baseRoutes.set(q,g.path(w,q,true));}
  for(const center of anchors){
   const seed=(p.id*.63+(a.def.id.length%5)*.37),radii=a.exact||a.near&&a.def.kind==='extractor'?[0]:a.near?(config.macroForecast?[3.3,4.1,6,8,10]:[3.3,4.1]):[5,7.5,10,12.5,15,18,21,25,30];
   for(const r of radii)for(let i=0;i<18;i++){
    const angle=seed+i*Math.PI/9+(Math.floor(time/20)%4)*Math.PI/36,point={x:center.x+Math.cos(angle)*r,y:center.y+Math.sin(angle)*r};
    if(a.def.kind!=='extractor'&&Object.values(p.knowledge||{}).some(n=>n.kind==='resource'&&n.resource<2&&n.amount<=0&&distance(n,point)<a.def.size+1.8))continue;
    if(dangerous(point,4)||!safeRoute(w,point)||g.placement(a.def.id,p.id,point.x,point.y))continue;
    // A foundation must never trap a friendly unit in its newly blocked nav cells.
    if(own.some(u=>u.kind==='unit'&&!definition(u)?.air&&Math.hypot(Math.floor(u.x)+.5-point.x,Math.floor(u.y)+.5-point.y)<a.def.size+.5))continue;
    const approach=g.approach(w,{...point,size:a.def.size},1.3),route=g.path(w,approach),end=route.at(-1)||w;if(distance(end,point)>a.def.size+1.8)continue;
    // Leave the east side of every extension-capable building usable.
    if(f.extensions.some(ex=>ex.building===a.def.id&&!ex.upgradeTo)&&g.extensionFits&&!g.extensionFits({kind:'building',owner:p.id,type:a.def.id,x:point.x,y:point.y,size:a.def.size,id:-1}))continue;
    const urgent=a.priority>=100&&['house','inf','hq','air'].includes(a.def.kind),crew=urgent&&workers.length>=10?workers.filter(v=>v.id!==w.id&&freeWorker(v)&&!v.carry&&safeRoute(v,point)).sort((a,b)=>distance(a,point)-distance(b,point)).slice(0,(config.constructionCrew||1)-1):[];if(config.recoveryCoordination&&!keepsRoutes(g,p,a.def,point,w,routeGoals,baseRoutes))continue;if(g.build(a.def.id,p.id,point.x,point.y,[w.id,...crew.map(v=>v.id)]).ok){state.lastBuild=time;return true;}
   }
  }
  state.failedSites[a.key]=time+10;return false;
 }
 // Rescue abandoned projects and repair vulnerable key structures with bounded labor.
 const usable=workers.filter(w=>!w.aiLogistics&&!w.embarkedBy&&w.order?.kind!=='extract'&&!(w.aiScoutUntil>time));
 for(const w of usable)if(['build','repair'].includes(w.order?.kind)&&w.stuck>6){const ws=state.workers[w.id]||(state.workers[w.id]={});ws.failedProject=w.order.target;ws.failedUntil=time+25;g.order([w.id],{kind:'stop'});}
 for(const b of buildings.filter(b=>b.progress<1&&!dangerous(b,5)).sort((a,b)=>(definition(a)?.kind==='hq'?-2:0)-(definition(b)?.kind==='hq'?-2:0)||b.progress-a.progress)){
  const assigned=workers.filter(w=>['build','repair'].includes(w.order?.kind)&&w.order.target===b.id).length;
  if(!assigned){const w=workers.filter(freeWorker).filter(w=>!(state.workers[w.id]?.failedProject===b.id&&state.workers[w.id]?.failedUntil>time)).sort((a,c)=>distance(a,b)-distance(c,b)).find(w=>{const q=g.approach(w,b,1.3),route=g.path(w,q);return distance(route.at(-1)||w,b)<b.size+1.8;});if(w)g.order([w.id],{kind:'build',target:b.id});}
 }
 if(stock[0]>Math.max(90,sustainable.cost[0]+30)&&workers.length>=6){const damaged=ready.filter(b=>b.hp<b.maxHp*.72&&!dangerous(b,5)).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];if(damaged&&!workers.some(w=>w.order?.kind==='repair')){const w=builder(damaged);if(w)g.order([w.id],{kind:'repair',target:damaged.id});}}
 // Strong opponents protect worker growth from speculative technology reservations.
 // Payment and population limits are the same as for a human player.
 if(config.grade>=8&&!threatened&&armySize>=Math.max(4,(workers.length-5)*1.2)&&ready.some(b=>definition(b)?.kind==='inf')&&workers.length+deepWorkers+queued.filter(d=>d.worker).length<Math.min(16,workerLimit)&&capacity-g.population(p.id)>2){
  const worker=f.units.find(u=>u.worker),base=ready.find(b=>definition(b)?.kind==='hq'&&!queueOf(b).length);
  if(base&&g.affordable(p.id,worker.cost)&&protectedSpend(p,worker))g.queue(base.id,worker.id);
 }
 // Reinvest in a productive workforce while the army can protect its route.
 // This buys ordinary workers with banked resources; it never credits forecast income.
 if(config.recoveryCoordination&&!threatened&&!sustainable.bootstrap&&!sustainable.tradeFirst&&armySize>=3){
  const worker=f.units.find(u=>u.worker),base=ready.find(b=>definition(b)?.kind==='hq'&&!queueOf(b).length),headcount=workers.length+deepWorkers+queued.filter(d=>d.worker).length;
  const productiveOre=safeNodes.filter(n=>n.resource===0&&drops.some(b=>serves(b,0)&&distance(b,n)<13)).reduce((n,r)=>n+r.amount,0),growth=Math.min(workerLimit,Math.floor(7+armySize*(.35+config.grade*.06)));
  const protection=readyChoices.filter(({u})=>u.damage>0&&!u.airOnly).reduce((n,{u})=>Math.min(n,u.cost[0]),60);
  if(base&&headcount<growth&&productiveOre>headcount*100&&g.capacity(p.id)-g.population(p.id)>3&&worker.cost.every((v,i)=>!v||stock[i]-v>=(sustainable.cost[i]||0)+(i===0?protection:0))){if(g.queue(base.id,worker.id).ok)queued.push(worker);}
 }
 let bought=false;
 // Housing is a prerequisite to the next production wave. Upper tiers may
 // finance it from cash plus charted liquid supplies, while still preserving
 // the total resources needed to finish their survival chain.
 const fundedHousing=config.grade>=7&&action?.def.kind==='house'&&capacity-population<=Math.max(5,wavePopulation)&&!threatened&&!sustainable.bootstrap&&!sustainable.tradeFirst&&workers.some(w=>['gather','returnCargo','extract'].includes(w.order?.kind))&&action.def.cost.every((v,i)=>!v||stock[i]>=v&&stock[i]-v+(sustainable.liquidRemaining?.[i]||0)>=(sustainable.cost[i]||0)+(i===0?60:0));
 const mayBuy=action&&(!config.macroForecast||protectedSpend(p,action.def)||fundedHousing||!sustainable.bootstrap&&['hq','inf'].includes(action.def.kind));
 if(mayBuy){
  if(action.kind==='build')bought=buildAction(action);
  else if(action.kind==='deep'){const w=builder(action.near);if(w)bought=!!g.build(action.def.id,p.id,action.near.x,action.near.y,[w.id]).ok;}
  else{const b=action.building||ready.find(b=>b.type===action.def.building&&queueOf(b).length===0);if(b&&queueOf(b).length<2&&g.affordable(p.id,action.def.cost))bought=!!g.queue(b.id,action.def.id,action.kind).ok;}
 }
 if(bought){state.goal=null;state.lastInvestment=time;}
 else if(mayBuy&&(config.recoveryCoordination||p.aiState?.recovery?.stalled)&&g.affordable(p.id,action.def.cost))state.failedSites[action.key]=Math.max(state.failedSites[action.key]||0,time+6);
 // Do not reserve an impossible resource forever. Stock accumulation still funds tech,
 // while a paced Ore-only replacement can keep the player alive during a shortage.
 const reserve=[...(!bought&&action&&action.priority>=45?state.goalCost:[0,0,0,0])];for(let i=0;i<4;i++){const survival=sustainable.cost[i]-(bought&&sustainable.ids.includes(action.def.id)?action.def.cost[i]:0);reserve[i]=config.macroForecast&&!bought&&action&&action.priority>=45&&!sustainable.ids.includes(action.def.id)?reserve[i]+survival:Math.max(reserve[i],survival);}p.aiReserve=reserve;
 function spendable(cost,emergency=false){return cost.every((v,i)=>config.recoveryCoordination&&v===0||stock[i]>=v&&((emergency&&(!v||stock[i]-v+(sustainable.liquidRemaining||sustainable.remaining)[i]>=sustainable.cost[i]+(i===0?120:30)))||stock[i]-v>=(reserve[i]||0)));}
 const queuedWorkers=queued.filter(d=>d.worker).length;
 const paidProduction=ready.filter(b=>['inf','counter','armor','air','elite','dock'].includes(definition(b)?.kind)).length;
 const growthLimit=config.adaptiveEconomy?Math.max(9,Math.min(workerLimit,Math.max(Math.floor(8+armySize*.55),config.macroForecast?paidProduction*(3+config.grade*.4)+8:config.grade>=9?paidProduction*5+5:0))):workerLimit;
 const targetWorkers=Math.min(workerLimit,growthLimit,Math.max(7,Math.floor(capacity*.55)),safeNodes.length||config.recoveryCoordination&&ready.some(b=>definition(b)?.kind==='deepMine'&&b.lastExtraction>time-30)?workerLimit:7);
 const workerDef=f.units.find(u=>u.worker),hq=ready.find(b=>definition(b)?.kind==='hq'&&queueOf(b).length<1);
 const escortFirst=config.macroForecast&&armyDefs.filter(d=>d.damage>0&&d.role!=='scout').length<2&&nodes.some(n=>n.resource===0)&&!nodes.some(n=>n.resource===0&&distance(n,home)<14);
 if(hq&&!escortFirst&&!(incomeThreatened&&armySize<3)&&!sustainable.bootstrap&&workers.length+deepWorkers+queuedWorkers<targetWorkers&&(!threatened||workers.length<6)&&spendable(workerDef.cost,workers.length<Math.min(10,targetWorkers)&&!threatened||workers.length<7)&&capacity-g.population(p.id)>1)g.queue(hq.id,workerDef.id);
 if(armySize<armyLimit&&!sustainable.bootstrap){
  const production=ready.filter(b=>queueOf(b).length<1).map(b=>({b,options:unitOrder.filter(({u})=>u.building===b.type&&!g.missing(p.id,u,b).length)})).filter(v=>v.options.length);
  production.sort((a,b)=>(b.options[0]?.value||0)-(a.options[0]?.value||0));
  for(const {b,options:originalOptions}of production){
   // Re-evaluate after every paid queue so simultaneous factories fill missing roles.
   const options=config.macroForecast?originalOptions.map(({u})=>({u,value:unitValue(u)})).sort((a,b)=>b.value-a.value||a.u.cost[0]-b.u.cost[0]):originalOptions;
   const emergency=threatened||armySize<4||!(action?.priority>=110)&&time-(state.lastBasic||0)>24&&(!config.macroForecast||armySize<12||!action||!fundable(action.def));
   const choice=options.find(({u,value})=>value>0&&spendable(u.cost))||options.find(({u,value})=>value>0&&emergency&&!u.special&&u.cost.slice(1).every(v=>v===0)&&spendable(u.cost,true))||(config.pressureProduction?options.find(({u,value})=>value>-90&&u.damage>0&&!u.airOnly&&!u.special&&!u.transport&&C.category(u)!=='breacher'&&u.role!=='scout'&&spendable(u.cost)):null);
   if(choice&&g.queue(b.id,choice.u.id).ok){armyDefs.push(choice.u);state.lastBasic=time;}
  }
 }
 // Upcoming concrete costs determine staffing, rather than worker index modulo four.
 let demand=sumCost([180+workers.length*5,0,0,0],sustainable.cost);if(action)demand=sumCost(demand,action.def.cost);
 for(const {u}of (config.adaptiveEconomy?readyChoices:unitOrder.filter(({u,value})=>value>0&&canPlan(u))).slice(0,3))demand=sumCost(demand,u.cost,1.5);
 if(strategyTime>90&&armySize>=5)demand=sumCost(demand,D.research[f.id+'_economy'].cost,.5);
 demand[0]=Math.max(300,demand[0]);demand[3]=Math.max(sustainable.cost[3],Math.min(70,demand[3]));
 const hostileBases=config.recoveryCoordination?Object.values(p.knowledge||{}).filter(e=>e.kind==='building'&&e.hp>0&&g.hostile(p.id,e.owner)&&['hq','inf','armor','air','elite','defense'].includes(definition(e)?.kind)):[];
 const workable=nodes.filter(n=>!dangerous(n,5)&&!hostileBases.some(b=>distance(b,n)<12)&&(n.resource!==1||ready.some(b=>definition(b)?.resource==='oil'&&distance(b,n)<6)));
 const byResource=D.resources.map((r,i)=>workable.filter(n=>n.resource===i));
 const eligible=usable.filter(w=>!['build','repair'].includes(w.order?.kind));
 const quotas=[byResource[0].length?Math.min(eligible.length,Math.max(Math.min(4,eligible.length),Math.ceil(eligible.length*(threatened||config.grade>=8&&workers.length<16?.70:.54)))):0,0,0,0];
 // Staff a missing ingredient of the next concrete investment before spreading
 // workers across aggregate future demand. A fraction of one Rift Crystal must
 // not leave funded drilling research waiting behind another thousand Ore.
 if(config.macroForecast&&action){for(let r=1;r<4;r++)if(action.def.cost[r]>stock[r]&&byResource[r].some(n=>eligible.some(w=>workerReaches(w,n)))){
  if(quotas.reduce((a,b)=>a+b,0)>=eligible.length){if(quotas[0]<=Math.min(2,eligible.length))continue;quotas[0]--;}
  quotas[r]=1;
 }}
 const need=demand.map((v,i)=>byResource[i].length?Math.max(0,v-stock[i])/(i===0?80:i===3?38:55):0);need[0]=Math.max(need[0],.2);
 while(quotas.reduce((a,b)=>a+b,0)<eligible.length){let best=0,score=-1;for(let i=0;i<4;i++){const s=need[i]/(quotas[i]+1);if(s>score&&byResource[i].length){best=i;score=s;}}quotas[best]++;}
 state.desiredWorkers=quotas;state.demand=demand;
 const assigned=[0,0,0,0],nodeUse=new Map();
 // Retain productive assignments, especially while carrying a load, and only move a
 // small surplus after the assignment has lasted long enough to repay its travel.
 const stable=[];for(const w of eligible){
  const s=state.workers[w.id]||(state.workers[w.id]={}),n=nodeById.get(w.order?.target||s.node);
  if(!s.sample||distance(w,s.sample)>.6||Math.abs((w.carry||0)-(s.cargo||0))>.4){s.sample={x:w.x,y:w.y};s.cargo=w.carry||0;s.progressAt=time;}
  if(dangerous(w,3)||n&&dangerous(n,5)){
   const retreat=drops.filter(b=>!dangerous(b,5)).sort((a,b)=>distance(w,a)-distance(w,b))[0]||home;
   if(!(s.fleeUntil>time)){const point=g.approach?g.approach(w,retreat,2):retreat;g.order([w.id],{kind:'move',x:point.x,y:point.y});s.fleeUntil=time+8;s.node=null;}
   continue;
  }
  if(s.fleeUntil>time)continue;
  // Bank cargo before changing jobs or walking to a remembered deposit. A full
  // load is real income only after delivery, and a move order never deposits it.
  if(config.recoveryCoordination&&w.carry>0&&(w.order?.kind==='returnCargo'||w.order?.kind!=='gather'||!n||n.resource!==w.carryType)){
   const drop=g.collectionPoint(w);if(drop&&!dangerous(drop,3)&&safeRoute(w,drop)){
    if(w.order?.kind!=='returnCargo')g.order([w.id],{kind:'returnCargo'});
    stable.push(w.id);continue;
   }
  }
  const stuck=(w.stuck||0)>5||time-(s.progressAt??time)>18&&w.action!=='gather';
  if(stuck&&n){s.avoid=n.id;s.avoidUntil=time+25;s.node=null;s.assignedAt=0;}
  if(n&&!stuck&&workable.some(v=>v.id===n.id)&&safeRoute(w,n)&&(w.order?.kind==='gather'||w.order?.kind==='move'&&s.node===n.id)){
   const r=n.resource,keep=(w.carry||0)>0||time-(s.assignedAt||0)<14||assigned[r]<quotas[r];
   if(keep){assigned[r]++;nodeUse.set(n.id,(nodeUse.get(n.id)||0)+1);stable.push(w.id);if(n.observed&&w.order?.kind!=='gather')g.order([w.id],{kind:'gather',target:n.id});continue;}
  }
  if(s.projectUntil>time&&w.order?.kind==='move')stable.push(w.id);
 }
 for(const w of eligible){
  const s=state.workers[w.id]||(state.workers[w.id]={});if(stable.includes(w.id)||s.fleeUntil>time||dangerous(w,3))continue;
  const resourceOrder=[0,1,2,3].sort((a,b)=>(quotas[b]-assigned[b])-(quotas[a]-assigned[a]));let best=null;
  for(const r of resourceOrder){
   if(r!==0&&stock[r]>Math.max(300,demand[r]*2))continue;
   const candidates=byResource[r].filter(n=>!(n.id===s.avoid&&s.avoidUntil>time)&&safeRoute(w,n)&&workerReaches(w,n));
   candidates.sort((a,b)=>nodeScore(a)-nodeScore(b));if(candidates.length){best=candidates[0];break;}
  }
  function nodeScore(n){
   const servingDrops=drops.filter(b=>serves(b,n.resource));let travel=distance(w,n),haul=servingDrops.length?Math.min(...servingDrops.map(b=>distance(b,n))):distance(home,n)+40;
   if(config.recoveryCoordination){
    travel=state.routes[w.id+':'+n.id]?.travel??travel;state.haulRoutes||={};const cached=state.haulRoutes[n.id],signature=servingDrops.map(b=>b.id).join(',');
    if(cached&&cached.until>time&&cached.signature===signature)haul=cached.length;
    else{
     const start=g.approach(w,n,.7),model={...w,...start};let shortest=Infinity;
     for(const drop of [...servingDrops].sort((a,b)=>distance(a,n)-distance(b,n)).slice(0,1+Math.floor((config.grade-3)/3))){
      const q=g.approach(model,drop,1),route=g.path(model,q);if(distance(route.at(-1)||model,q)>2||route.some(v=>!p.explored[Math.floor(v.y)*g.n+Math.floor(v.x)]))continue;
      let last=model,length=0;for(const point of route){length+=distance(last,point);last=point;}shortest=Math.min(shortest,length);
     }
     haul=Number.isFinite(shortest)?shortest:Math.max(haul,200);state.haulRoutes[n.id]={signature,length:haul,until:time+20};
    }
   }
   return travel+haul*(config.recoveryCoordination?1.5:.65)+(nodeUse.get(n.id)||0)*2.1+(n.observed?0:3);
  }
  if(best&&!(best.resource!==0&&stock[best.resource]>Math.max(300,demand[best.resource]*2))){const changed=s.node!==best.id||!w.order||w.order.kind==='gather'&&w.order.target!==best.id||w.order.kind!=='gather'&&best.observed;s.node=best.id;assigned[best.resource]++;nodeUse.set(best.id,(nodeUse.get(best.id)||0)+1);if(changed){s.assignedAt=time;s.progressAt=time;if(best.observed)g.order([w.id],{kind:'gather',target:best.id});else{const point=g.approach?g.approach(w,best,.6):best;g.order([w.id],{kind:'move',x:point.x,y:point.y});}}}
  else if(['gather','move'].includes(w.order?.kind)&&!(w.aiScoutUntil>time)&&!(s.projectUntil>time)&&!(w.carry>0))g.order([w.id],{kind:'stop'});
 }
 state.activeWorkers=assigned;state.lastStep=time;
 return{workers:workers.length,army:armySize,threatened,goal:state.goal,nodes:nodeById.size};
}
const api={counterDemand,findChokePoints,recover,keepsRoutes,step,knownResources,sustainability,protectedSpend,upgradePriority};root.FractureAIEconomy=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
