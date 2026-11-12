'use strict';
(function(root){
const D=root.FD||(typeof require!=='undefined'?require('./data.js'):null),C=root.FractureCombat||(typeof require!=='undefined'?require('./combat.js'):null);
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y), alive=e=>e&&e.hp>0;
const sumCost=(a,b,k=1)=>a.map((v,i)=>v+(b?.[i]||0)*k);
const definition=e=>e?.kind==='unit'?D.units[e.type]:D.buildings[e?.type];
const queueOf=b=>b.queue||[];
function segmentDistance(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(p.x-a.x-dx*t,p.y-a.y-dy*t);}
// The resource list is a view of private memory, refreshed only at visible locations.
// In particular, a depleted deposit outside vision must not change AI decisions.
function knownResources(g,p){
 const current=new Map();for(const e of g.entities||[])if(e.kind==='resource'&&g.visible(p.id,e)&&e.hp>0&&e.amount>0)current.set(e.id,e);
 const result=new Map();for(const e of Object.values(p.knowledge||{}))if(e.kind==='resource'&&e.hp>0&&e.amount>0&&!g.visible(p.id,e))result.set(e.id,{...e,observed:false});
 for(const e of current.values())result.set(e.id,{...e,observed:true});return [...result.values()];
}
// Price the complete renewable-economy chain before any controller spends.
// Already paid foundations/research queues are excluded; all four currencies matter.
function sustainability(g,p,ctx={}){
 const own=(ctx.own||g.entities.filter(e=>e.owner===p.id)).filter(alive),workers=own.filter(e=>e.kind==='unit'&&definition(e)?.worker&&!e.embarkedBy),f=D.factions[p.faction];
 const completed=id=>p.tech.includes(id)||own.some(e=>e.type===id&&e.kind==='building');
 const pending=id=>own.some(e=>e.queue?.some(q=>q.type===id));
 const need=new Map();function add(id){if(!id||completed(id)||pending(id)||need.has(id))return;const d=D.buildings[id]||D.research[id]||D.units[id];if(!d)return;need.set(id,d);for(const r of d.requires||[])add(r);add(d.research);if(D.research[id]||D.units[id])add(d.building);}
 const cache=p.aiSupplyRoutes||(p.aiSupplyRoutes={}),nodes=knownResources(g,p),exhausted=Object.values(p.knowledge||{}).filter(n=>n.kind==='resource'&&n.amount<=0);
 const reachable=n=>{const candidates=workers.filter(w=>!w.aiLogistics).sort((a,b)=>distance(a,n)-distance(b,n)).slice(0,3),signature=candidates.map(w=>w.id+':'+Math.floor(w.x/8)+':'+Math.floor(w.y/8)).join(','),c=cache[n.id];if(c&&c.signature===signature&&c.until>g.time)return c.ok;const ok=candidates.some(w=>{const q=g.approach(w,n,.7);const route=g.path(w,q);return distance(route.at(-1)||w,q)<2&&route.every(v=>p.explored[Math.floor(v.y)*g.n+Math.floor(v.x)]);});cache[n.id]={ok,signature,revision:p.navigationRevision,until:g.time+12};return ok;};
 const accessible=nodes.filter(reachable),remaining=D.resources.map((_,r)=>accessible.filter(n=>n.resource===r).reduce((sum,n)=>sum+n.amount,0));
 const supply=[...accessible,...exhausted.filter(reachable)],mineResources=[];
 p.aiRenewableTargets||=[];if(workers.length&&g.time>20)for(const r of [0,1,2,3]){if(supply.some(n=>n.resource===r)&&remaining[r]<(r===0?3500:r===1?1200:500)&&!p.aiRenewableTargets.includes(r))p.aiRenewableTargets.push(r);if(p.aiRenewableTargets.includes(r)&&!own.some(b=>b.type===f.id+'_deep_'+D.resources[r])){mineResources.push(r);add(f.id+'_deep_'+D.resources[r]);}}
 // Oil cannot be gathered without a collection facility; reserve that prerequisite too.
 if(need.size&&remaining[1]>0&&!own.some(b=>definition(b)?.kind==='extractor'&&definition(b)?.resource==='oil'))add(f.buildings.find(b=>b.kind==='extractor'&&b.resource==='oil')?.id);
 const maritime=['rivers','narrows','continental','small-islands','large-islands','mediterranean','coastal'].includes(g.options.layout);
 const relocation=maritime&&remaining[0]<1800&&workers.length>=4;
 if(relocation&&!own.some(u=>definition(u)?.transport)){add(f.id+'_transport_ship');add(f.buildings.find(b=>b.kind==='extractor'&&b.resource==='oil')?.id);}
 const outpost=p.aiLogistics?.expansion||p.aiLogistics?.lastExpansion,depot=outpost?.depot&&D.buildings[outpost.depot],site=outpost?.landing||outpost,needsDepot=depot&&!own.some(b=>b.kind==='building'&&['hq','depot','extractor'].includes(definition(b)?.kind)&&distance(b,site)<10);
 if(needsDepot)for(const req of depot.requires||[])add(req);
 const cost=[0,0,0,0];for(const d of need.values())d.cost.forEach((v,i)=>cost[i]+=v);
 if(needsDepot){depot.cost.forEach((v,i)=>cost[i]+=v);need.set(depot.id,depot);}
 const plan={cost,ids:[...need.keys()],remaining,resources:mineResources,relocation,critical:need.size>0&&remaining[0]<cost[0]+600,at:g.time};p.aiSustainability=plan;p.aiReserve=cost.map((v,i)=>Math.max(v,p.aiReserve?.[i]||0));return plan;
}
function protectedSpend(p,d){const plan=p.aiSustainability;if(!plan)return true;return plan.ids.includes(d.id)||d.cost.every((v,i)=>p.stock[i]-v>=(plan.cost[i]||0));}
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
 const localThreats=threats.filter(e=>distance(e,home)<14),threatened=localThreats.length>=3||localThreats.reduce((n,e)=>n+(definition(e)?.damage||23),0)>=40;
 // Cache routes against private map knowledge; distant deposits on another island
 // cannot receive builders or gatherers until a transport establishes a foothold.
 state.routes||={};const probe=workers[0]||military.find(u=>!definition(u)?.air);
 function reachable(n){if(!probe)return false;const cached=state.routes[n.id],key=p.navigationRevision||0,anchors=workers.filter(w=>!w.aiLogistics).sort((a,b)=>distance(a,n)-distance(b,n)).slice(0,3),signature=anchors.map(w=>w.id+':'+Math.floor(w.x/8)+':'+Math.floor(w.y/8)).join(',');if(cached&&cached.until>time&&cached.signature===signature)return cached.ok;const ok=anchors.some(w=>{const q=g.approach(w,n,.7);const route=g.path(w,q);return distance(route.at(-1)||w,q)<2&&route.every(v=>p.explored[Math.floor(v.y)*g.n+Math.floor(v.x)]);});state.routes[n.id]={ok,key,signature,until:time+12};return ok;}
 function workerReaches(w,n){const key=w.id+':'+n.id,c=state.routes[key],signature=Math.floor(w.x/8)+':'+Math.floor(w.y/8),revision=p.navigationRevision||0;if(c&&c.until>time&&c.signature===signature)return c.ok;const q=g.approach(w,n,.7),route=g.path(w,q),ok=distance(route.at(-1)||w,q)<2&&route.every(v=>p.explored[Math.floor(v.y)*g.n+Math.floor(v.x)]);state.routes[key]={ok,signature,revision,until:time+12};return ok;}
 const nodes=knownResources(g,p).sort((a,b)=>distance(home,a)-distance(home,b)).slice(0,48).filter(reachable),nodeById=new Map(nodes.map(n=>[n.id,n]));
 const drops=ready.filter(b=>['hq','depot','extractor'].includes(definition(b)?.kind));
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
 function unitValue(u){
  if(u.naval||u.transport||u.role==='merchant')return -100;if(islandWar&&!u.air&&armyDefs.filter(d=>!d.air&&!d.worker).length>=24)return -100;
  if(u.worker||(u.special||0)>(p.special||0))return -100;
  const desired=roles[u.role]||0,count=countRole(u.role);let value=desired>0?26*(desired-count)/(desired+1):-16;
  if(u.detector&&detectors<(stealthSeen?2:1))value+=35;
  if(u.aa&&!u.airOnly&&airCount)value+=Math.min(14,airCount*3)/(1+armyDefs.filter(d=>d.aa&&!d.airOnly).length*.15);
  if(u.bonus==='armor'&&armorCount)value+=Math.min(12,armorCount*2)/(1+count*.3);
  if((u.splash||u.role==='heavy')&&meleeCount)value+=Math.min(9,meleeCount*1.5)/(1+count*.25);
  if(u.airOnly&&!airCount)value-=20;
  if(config.adaptiveEconomy&&C.category(u)==='breacher'){if(armySize<12)value-=35;else if(armyDefs.filter(d=>C.category(d)==='breacher').length>=Math.max(1,fortCount))value-=25;}
  if(u.role==='scout'&&count>=roles.scout)value-=35;
  if(u.role==='support'&&count>=roles.support)value-=30;
  if(u.range>=3&&u.damage>0&&!u.airOnly)value+=2;
  if(config.counterWeight&&foeUnits.length&&u.damage>0){const compatible=foeUnits.filter(t=>(!t.air||u.aa)&&(!u.airOnly||t.air));const matchup=compatible.reduce((n,t)=>n+C.multiplier(u,t),0)/foeUnits.length;value+=Math.max(-14,Math.min(18,(matchup-1)*18))*config.counterWeight;}
  if(config.forecastFire&&foeUnits.length&&u.damage>0&&!u.airOnly){const targets=foeUnits.filter(t=>(!t.air||u.aa)&&(!u.airOnly||t.air));const damage=targets.reduce((n,t)=>n+Math.max(1,u.damage*C.multiplier(u,t)-(t.armor||0)),0)/foeUnits.length;const valuePerCost=damage/(u.cooldown||1.25)*Math.sqrt(u.hp)/(u.cost[0]+u.cost[1]*1.2+u.cost[2]*1.5+u.cost[3]*2+20);value+=Math.min(16,valuePerCost*7)*config.counterWeight;}
  value-=Math.max(0,armyDefs.filter(d=>d.id===u.id).length-2)*.2;
  return value;
 }
 const unitOrder=f.units.filter(u=>!u.worker).map(u=>({u,value:unitValue(u)})).sort((a,b)=>b.value-a.value||a.u.cost[0]-b.u.cost[0]);
 function canPlan(u){
  if(unitValue(u)<1)return false;
  // One useful field army and a productive branch come before a collection of empty factories.
  if(config.forecastFire&&!hasReady(u.building)&&armySize<20&&!islandWar&&!u.detector&&!(u.heal&&armySize>=8)&&!(airCount>=3&&u.aa)&&!(fortCount>=2&&u.role==='siege')&&D.buildings[u.building]?.kind!=='inf')return false;
  if(threatened&&armySize<5)return u.cost.slice(1).every(n=>!n)&&!u.research;
  if(u.detector&&detectors===0)return true;
  if(config.level>=8&&armySize<6)return !u.requires?.length&&!u.extension&&!u.research;
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
 if(!existingType(inf.id).length)plan(buildingAction(inf.id,120));
 const capacity=g.capacity(p.id),population=g.population(p.id),pendingHouse=buildings.some(b=>definition(b)?.kind==='house'&&b.progress<1);
 if(capacity<200&&capacity-population<Math.max(5,Math.min(12,armySize*.25+3))&&!pendingHouse)plan({kind:'build',def:house,priority:capacity-population<2?125:105,key:'house'});
 const oilNodes=nodes.filter(n=>n.resource===1&&!dangerous(n,5)),needOil=stock[1]<100&&(armySize>=3||strategyTime>65)&&!buildings.some(b=>definition(b)?.resource==='oil'&&oilNodes.some(n=>distance(b,n)<6));
 if(needOil){const oil=oilNodes.filter(n=>!buildings.some(b=>definition(b)?.resource==='oil'&&distance(b,n)<6)).sort((a,b)=>distance(a,home)-distance(b,home))[0];if(oil)plan({kind:'build',def:f.buildings.find(b=>b.resource==='oil'),near:oil,priority:sustainable.ids.includes(f.buildings.find(b=>b.resource==='oil')?.id)?132:stock[1]<60?119:70,key:'oil:'+oil.id});}
 if(p.aiLogistics?.transportWanted){
  const u=D.units[p.aiLogistics.transportWanted],transportPriority=sustainable.relocation?131:114;
  if(u&&!own.some(e=>e.type===u.id)&&!queuedType(u.id)){
   const next=unlockAction(u,transportPriority);if(next)plan(next);
   else if(hasReady(u.building)&&!g.missing(p.id,u,ready.find(b=>b.type===u.building)).length)plan({kind:'unit',def:u,priority:transportPriority,key:'transport:'+u.id});
  }
 }else if(p.aiLogistics?.needAirTransport)plan(unlockAction(D.units[f.id+'_air_transport'],109));
 if(strategyTime>65&&armySize>=(config.level>=8?6:4))plan(buildingAction(f.buildings.find(b=>b.kind==='lab').id,68));
 for(const {u,value}of unitOrder)if(canPlan(u))plan(unlockAction(u,(u.detector&&!detectors?88:47+value*.6)));
 if(strategyTime>115&&workers.length>=9&&!threatened)plan(researchAction(f.id+'_economy',config.level>=7&&workers.length>=12&&armySize>=3?92:69));
 if(strategyTime>130&&armySize>=7){plan(researchAction(f.id+'_weapons1',62));if(strategyTime>175)plan(researchAction(f.id+'_armor1',54));}
 if(strategyTime>270&&armySize>=18&&!threatened){plan(researchAction(f.id+'_weapons2',43));plan(researchAction(f.id+'_armor2',40));}
 // Branch upgrades are only purchased for branches that are actually fielding units.
 if(strategyTime>230&&armySize>=15&&!threatened)for(const b of ready)if(armyDefs.filter(u=>u.building===b.type).length>=5)plan(researchAction(b.type+'_specialization',39));
 if(strategyTime>135&&armySize>=7&&!buildings.some(b=>definition(b)?.kind==='defense')&&(threatened||stock[0]>350))plan(buildingAction(f.buildings.find(b=>b.kind==='defense').id,threatened?84:35));
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
  else{const n=Object.values(p.knowledge||{}).find(n=>n.kind==='resource'&&n.resource===r&&n.amount<=0&&!dangerous(n,5)&&reachable(n)&&!g.placement(id,p.id,n.x,n.y,false,null,true));if(n)plan({kind:'deep',def:D.buildings[id],near:n,priority:priority+1,key:'deep:'+n.id});}
 }

 if(strategyTime>110&&workers.length>=9&&!threatened){
  const expansion=safeNodes.filter(n=>n.amount>180&&(n.resource===0||stock[n.resource]<60)&&buildings.filter(b=>definition(b)?.resource===D.resources[n.resource]&&definition(b)?.kind==='extractor').length<3&&!buildings.some(b=>['hq','depot','extractor'].includes(definition(b)?.kind)&&distance(b,n)<7)).map(n=>({n,score:(n.resource===0?12:3)+(oreLeft<500&&n.resource===0?15:0)-distance(n,home)*.25})).sort((a,b)=>b.score-a.score)[0];
  if(expansion&&(oreLeft<650||stock[0]>260||expansion.n.resource===0&&drops.every(b=>distance(b,expansion.n)>13))){const n=expansion.n,d=f.buildings.find(b=>b.resource===D.resources[n.resource]);plan({kind:'build',def:d,near:n,priority:oreLeft<350?82:45,key:'expansion:'+n.id});}
 }
 // Add capacity only when a useful branch is actually saturated and income supports it.
 if(strategyTime>150&&armySize<armyLimit&&stock[0]>(config.adaptiveEconomy?220:350)&&!threatened){const b=ready.find(b=>queueOf(b).some(q=>q.kind==='unit'&&!D.units[q.type]?.worker)&&existingType(b.type).length<(config.productionLimit||2)&&(config.level<9||existingType(b.type).every(other=>other.progress>=1&&queueOf(other).some(q=>q.kind==='unit'&&!D.units[q.type]?.worker)))&&f.units.some(u=>u.building===b.type&&unitValue(u)>5));if(b)plan({kind:'build',def:D.buildings[b.type],priority:config.adaptiveEconomy?94:32,key:'capacity:'+b.type,duplicate:true});}
 priorities.sort((a,b)=>b.priority-a.priority);
 for(let i=priorities.length-1;i>=0;i--)if(!protectedSpend(p,priorities[i].def)&&!['hq','inf'].includes(priorities[i].def.kind))priorities.splice(i,1);
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
 if(config.adaptiveEconomy&&action&&action.priority<100&&rebuildingArmy&&stock[0]-action.def.cost[0]<investmentFloor)action=null;
 if(action?.key!==state.goal){state.goal=action?.key||null;state.goalAt=time;}
 state.goalCost=action?.def?.cost||[0,0,0,0];
 function freeWorker(w){if(w.aiLogistics||w.embarkedBy||w.order?.kind==='extract')return false;const s=state.workers[w.id]||{};return w.aiScoutUntil<=time||!w.aiScoutUntil?!dangerous(w,2)&&!(s.fleeUntil>time)&&!['build','repair'].includes(w.order?.kind):false;}
 function builder(near){return workers.filter(freeWorker).filter(w=>safeRoute(w,near)).sort((a,b)=>(a.carry||0)*2+distance(a,near)-(b.carry||0)*2-distance(b,near))[0];}
 function buildAction(a){
  if(!a.def||g.missing(p.id,a.def).length||!g.affordable(p.id,a.def.cost))return false;
  const near=a.near||home,w=builder(near);if(!w||dangerous(near,3))return false;
  if(a.near&&!g.visible(p.id,a.near)){
   const s=state.workers[w.id]||(state.workers[w.id]={});if(s.project!==a.key){g.order([w.id],{kind:'move',x:near.x,y:near.y});s.project=a.key;s.projectUntil=time+25;}return false;
  }
  const anchors=a.near?[a.near]:[home,...drops.filter(b=>distance(b,home)>10&&safeRoute(home,b))];
  for(const center of anchors){
   const seed=(p.id*.63+(a.def.id.length%5)*.37),radii=a.near?[3.3,4.1]:[5,7.5,10,12.5,15,18,21,25,30];
   for(const r of radii)for(let i=0;i<18;i++){
    const angle=seed+i*Math.PI/9+(Math.floor(time/20)%4)*Math.PI/36,point={x:center.x+Math.cos(angle)*r,y:center.y+Math.sin(angle)*r};
    if(Object.values(p.knowledge||{}).some(n=>n.kind==='resource'&&n.resource<2&&n.amount<=0&&distance(n,point)<a.def.size+1.8))continue;
    if(dangerous(point,4)||!safeRoute(w,point)||g.placement(a.def.id,p.id,point.x,point.y))continue;
    // A foundation must never trap a friendly unit in its newly blocked nav cells.
    if(own.some(u=>u.kind==='unit'&&!definition(u)?.air&&Math.hypot(Math.floor(u.x)+.5-point.x,Math.floor(u.y)+.5-point.y)<a.def.size+.5))continue;
    const approach=g.approach(w,{...point,size:a.def.size},1.3),route=g.path(w,approach),end=route.at(-1)||w;if(distance(end,point)>a.def.size+1.8)continue;
    // Leave the east side of every extension-capable building usable.
    if(f.extensions.some(ex=>ex.building===a.def.id)&&g.extensionFits&&!g.extensionFits({kind:'building',owner:p.id,type:a.def.id,x:point.x,y:point.y,size:a.def.size,id:-1}))continue;
    const urgent=a.priority>=100&&['house','inf','hq','air'].includes(a.def.kind),crew=urgent&&workers.length>=10?workers.filter(v=>v.id!==w.id&&freeWorker(v)&&!v.carry&&safeRoute(v,point)).sort((a,b)=>distance(a,point)-distance(b,point)).slice(0,(config.constructionCrew||1)-1):[];if(g.build(a.def.id,p.id,point.x,point.y,[w.id,...crew.map(v=>v.id)]).ok){state.lastBuild=time;return true;}
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
 if(config.level>=8&&!threatened&&armySize>=Math.max(4,(workers.length-5)*1.2)&&ready.some(b=>definition(b)?.kind==='inf')&&workers.length+deepWorkers+queued.filter(d=>d.worker).length<Math.min(16,workerLimit)&&capacity-g.population(p.id)>2){
  const worker=f.units.find(u=>u.worker),base=ready.find(b=>definition(b)?.kind==='hq'&&!queueOf(b).length);
  if(base&&g.affordable(p.id,worker.cost)&&protectedSpend(p,worker))g.queue(base.id,worker.id);
 }
 let bought=false;
 if(action){
  if(action.kind==='build')bought=buildAction(action);
  else if(action.kind==='deep'){const w=builder(action.near);if(w)bought=!!g.build(action.def.id,p.id,action.near.x,action.near.y,[w.id]).ok;}
  else{const b=action.building||ready.find(b=>b.type===action.def.building&&queueOf(b).length===0);if(b&&queueOf(b).length<2&&g.affordable(p.id,action.def.cost))bought=!!g.queue(b.id,action.def.id,action.kind).ok;}
 }
 if(bought){state.goal=null;state.lastInvestment=time;}
 // Do not reserve an impossible resource forever. Stock accumulation still funds tech,
 // while a paced Ore-only replacement can keep the player alive during a shortage.
 const reserve=[...(!bought&&action&&action.priority>=45?state.goalCost:[0,0,0,0])];for(let i=0;i<4;i++)reserve[i]=Math.max(reserve[i],sustainable.cost[i]-(bought&&sustainable.ids.includes(action.def.id)?action.def.cost[i]:0));p.aiReserve=reserve;
 function spendable(cost,emergency=false){return cost.every((v,i)=>stock[i]>=v&&((emergency&&(!v||stock[i]-v+sustainable.remaining[i]>=sustainable.cost[i]+(i===0?120:30)))||stock[i]-v>=(reserve[i]||0)));}
 const queuedWorkers=queued.filter(d=>d.worker).length;
 const paidProduction=ready.filter(b=>['inf','counter','armor','air','elite','dock'].includes(definition(b)?.kind)).length;
 const growthLimit=config.adaptiveEconomy?Math.max(9,Math.min(workerLimit,Math.max(Math.floor(8+armySize*.55),config.level>=9?paidProduction*5+5:0))):workerLimit;
 const targetWorkers=Math.min(workerLimit,growthLimit,Math.max(7,Math.floor(capacity*.55)),safeNodes.length?workerLimit:7);
 const workerDef=f.units.find(u=>u.worker),hq=ready.find(b=>definition(b)?.kind==='hq'&&queueOf(b).length<1);
 if(hq&&workers.length+deepWorkers+queuedWorkers<targetWorkers&&(!threatened||workers.length<6)&&spendable(workerDef.cost,workers.length<Math.min(10,targetWorkers)&&!threatened||workers.length<7)&&capacity-g.population(p.id)>1)g.queue(hq.id,workerDef.id);
 if(armySize<armyLimit){
  const production=ready.filter(b=>queueOf(b).length<1).map(b=>({b,options:unitOrder.filter(({u})=>u.building===b.type&&!g.missing(p.id,u,b).length)})).filter(v=>v.options.length);
  production.sort((a,b)=>(b.options[0]?.value||0)-(a.options[0]?.value||0));
  for(const {b,options}of production){
   const emergency=threatened||armySize<4||!(action?.priority>=110)&&time-(state.lastBasic||0)>24;
   const choice=options.find(({u,value})=>value>0&&spendable(u.cost))||options.find(({u,value})=>value>0&&emergency&&!u.special&&u.cost.slice(1).every(v=>v===0)&&spendable(u.cost,true));
   if(choice&&g.queue(b.id,choice.u.id).ok){armyDefs.push(choice.u);state.lastBasic=time;}
  }
 }
 // Upcoming concrete costs determine staffing, rather than worker index modulo four.
 let demand=sumCost([180+workers.length*5,0,0,0],sustainable.cost);if(action)demand=sumCost(demand,action.def.cost);
 for(const {u}of (config.adaptiveEconomy?readyChoices:unitOrder.filter(({u,value})=>value>0&&canPlan(u))).slice(0,3))demand=sumCost(demand,u.cost,1.5);
 if(strategyTime>90&&armySize>=5)demand=sumCost(demand,D.research[f.id+'_economy'].cost,.5);
 demand[0]=Math.max(300,demand[0]);demand[3]=Math.max(sustainable.cost[3],Math.min(70,demand[3]));
 const workable=nodes.filter(n=>!dangerous(n,5)&&(n.resource!==1||ready.some(b=>definition(b)?.resource==='oil'&&distance(b,n)<6)));
 const byResource=D.resources.map((r,i)=>workable.filter(n=>n.resource===i));
 const eligible=usable.filter(w=>!['build','repair'].includes(w.order?.kind));
 const quotas=[byResource[0].length?Math.min(eligible.length,Math.max(Math.min(4,eligible.length),Math.ceil(eligible.length*(threatened||config.level>=8&&workers.length<16?.70:.54)))):0,0,0,0];
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
  function nodeScore(n){const dropDistance=drops.length?Math.min(...drops.map(b=>distance(b,n))):distance(home,n);return distance(w,n)+dropDistance*.65+(nodeUse.get(n.id)||0)*2.1+(n.observed?0:3);}
  if(best&&!(best.resource!==0&&stock[best.resource]>Math.max(300,demand[best.resource]*2))){const changed=s.node!==best.id||!w.order||w.order.kind==='gather'&&w.order.target!==best.id||w.order.kind!=='gather'&&best.observed;s.node=best.id;assigned[best.resource]++;nodeUse.set(best.id,(nodeUse.get(best.id)||0)+1);if(changed){s.assignedAt=time;s.progressAt=time;if(best.observed)g.order([w.id],{kind:'gather',target:best.id});else{const point=g.approach?g.approach(w,best,.6):best;g.order([w.id],{kind:'move',x:point.x,y:point.y});}}}
  else if(['gather','move'].includes(w.order?.kind)&&!(w.aiScoutUntil>time)&&!(s.projectUntil>time)&&!(w.carry>0))g.order([w.id],{kind:'stop'});
 }
 state.activeWorkers=assigned;state.lastStep=time;
 return{workers:workers.length,army:armySize,threatened,goal:state.goal,nodes:nodeById.size};
}
const api={step,knownResources,sustainability,protectedSpend};root.FractureAIEconomy=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
