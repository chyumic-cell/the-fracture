'use strict';
(function(root){
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function step(g,p,ctx){
 const D=root.FD||(typeof require!=='undefined'?require('./data.js'):null),s=(p.aiLogistics||={next:0}),own=g.entities.filter(e=>e.owner===p.id&&e.hp>0),ready=own.filter(e=>e.kind==='building'&&e.progress>=1),workers=own.filter(e=>e.kind==='unit'&&g.def(e).worker&&!e.embarkedBy),unsafe=q=>ctx.enemy.some(e=>g.def(e)?.damage>0&&dist(e,q)<(g.def(e).range||1)+5);
 const domainCombat=root.FractureAIDomainCombat||(typeof require!=='undefined'?require('./ai-domain-combat.js'):null);domainCombat?.step(g,p,ctx);
 const E=root.FractureAIEconomy||(typeof require!=='undefined'?require('./ai-economy.js'):null),canBuy=d=>E.protectedSpend(p,d);
 const done=id=>D.buildings[id]?g.hasBuilding(p.id,id):p.tech.includes(id),pending=id=>own.some(b=>b.type===id||b.queue?.some(q=>q.type===id));
 function ensure(id,visited=new Set()){
  if(done(id)||pending(id))return done(id);if(visited.has(id))return false;visited.add(id);const d=D.buildings[id]||D.research[id];if(!d)return false;
  for(const req of d.requires||[])if(!done(req)){ensure(req,visited);return false;}
  if(D.research[id]){if(!done(d.building)){ensure(d.building,visited);return false;}const b=ready.find(b=>b.type===d.building&&!b.queue.length);if(b&&canBuy(d))g.queue(b.id,id,'research');return false;}
  if(!g.affordable(p.id,d.cost)||!canBuy(d))return false;
  const w=workers.find(w=>!w.aiLogistics&&!['build','repair','extract'].includes(w.order?.kind)&&!unsafe(w));if(!w)return false;
  if(d.kind==='deepMine'){const n=g.entities.find(e=>e.kind==='resource'&&e.amount<=0&&D.resources[e.resource]===d.resource&&g.known(p.id,e)&&!unsafe(e)&&!g.placement(id,p.id,e.x,e.y));if(n)g.build(id,p.id,n.x,n.y,[w.id]);return false;}
  if(d.kind==='dock'){for(let r=5;r<Math.min(45,g.n/2);r+=2)for(let k=0;k<32;k++){const q={x:p.home.x+Math.cos(k*Math.PI/16)*r,y:p.home.y+Math.sin(k*Math.PI/16)*r};if(unsafe(q)||Object.values(p.knowledge||{}).some(n=>n.kind==='resource'&&n.resource<2&&n.amount<=0&&dist(n,q)<d.size+1.8)||g.placement(id,p.id,q.x,q.y))continue;if(g.build(id,p.id,q.x,q.y,[w.id]).ok)return false;}return false;}
  g.aiBuild(p,d,[w]);return false;
 }

 // Expansion parties use the same physical boarding, unloading, construction,
 // gathering and costs as the player. Only charted deposits are considered.
 if(s.expansion){const op=s.expansion,t=g.entity(op.carrier),party=op.ids.map(id=>g.entity(id)).filter(Boolean),node=g.entity(op.node);
  if(!t||!party.length||!node||g.time-op.started>op.budget){for(const u of party)u.aiLogistics=false;if(t&&g.transportLoad(t).length)g.order([t.id],{kind:'unload',...op.pickup});s.expansion=null;}
  else{t.aiLogistics=true;party.forEach(u=>u.aiLogistics=true);
   if(op.phase==='load'&&!t.returning){if(dist(t,op.pickup)>2){if(!t.order)g.order([t.id],{kind:'move',...op.pickup});}else{for(const u of party)if(!u.embarkedBy&&u.order?.kind!=='board')g.board([u.id],t.id,p.id);if(party.every(u=>u.embarkedBy===t.id)){op.phase='cross';g.order([t.id],{kind:'unload',...op.landing});}}}
   if(op.phase==='cross'&&!t.returning){if(!g.transportLoad(t).length){const builders=party.filter(u=>g.def(u).worker),depot=D.factions[p.faction].buildings.find(b=>b.kind==='depot'||b.kind==='extractor'&&b.resource===D.resources[node.resource]);if(builders.length&&depot&&canBuy(depot))g.aiBuild(p,depot,builders,node);for(const u of party){u.aiLogistics=false;if(!g.def(u).worker)g.order([u.id],{kind:'attackMove',...op.landing});else if(u.order?.kind!=='build'&&g.visible(p.id,node))g.order([u.id],{kind:'gather',target:node.id});}s.lastExpansion={x:op.landing.x,y:op.landing.y,node:op.node,depot:op.depot,at:g.time,naval:!!g.def(t).naval};s.expansion=null;g.order([t.id],{kind:'move',...op.pickup});}else if(!t.order)g.order([t.id],{kind:'unload',...op.landing});}
  }
 }
 // Scout from charted water toward the fog frontier. Unknown geography and hidden
 // enemy foundations must never influence which route the AI chooses.
 function seaGoal(ship){
  s.visited||={};const candidates=[];
  for(let y=2;y<g.n-2;y+=3)for(let x=2;x<g.n-2;x+=3){const q={x:x+.5,y:y+.5},i=y*g.n+x;
   if(!p.explored[i]||g.blocked(q.x,q.y,'water',p.id)||unsafe(q)||(s.visited[i]||0)>g.time)continue;
   let gain=0;for(let dy=-8;dy<=8;dy+=4)for(let dx=-8;dx<=8;dx+=4){const xx=x+dx,yy=y+dy;if(xx>=0&&yy>=0&&xx<g.n&&yy<g.n&&!p.explored[yy*g.n+xx])gain++;}
   if(gain)candidates.push({...q,index:i,score:gain*6-dist(ship,q)*.4});
  }
  for(const q of candidates.sort((a,b)=>b.score-a.score).slice(0,12)){if(dist(g.path(ship,q).at(-1)||ship,q)>2)continue;s.visited[q.index]=g.time+70;return q;}return null;
 }
 // Preserve actual passengers and assigned landing troops from land combat orders.
 for(const u of own)if(u.order?.kind==='board'&&!g.entity(u.order.target)){u.aiLogistics=false;g.order([u.id],{kind:'stop'});}
 const carriers=own.filter(e=>e.kind==='unit'&&g.def(e).transport&&e.id!==s.expansion?.carrier);let carrier=carriers.find(e=>e.id===s.sortie?.carrier)||(s.needAirTransport?carriers.find(e=>g.def(e).air):null)||carriers.find(e=>g.def(e).naval)||carriers[0];
 function waterBeside(q){let best=null,value=Infinity;for(let y=Math.floor(q.y)-4;y<=q.y+4;y++)for(let x=Math.floor(q.x)-4;x<=q.x+4;x++){const t={x:x+.5,y:y+.5},i=y*g.n+x;if(x<0||y<0||x>=g.n||y>=g.n||!p.explored[i]||g.blocked(t.x,t.y,'water',p.id))continue;const score=dist(t,q);if(score<value){value=score;best=t;}}return best;}
 function pickup(t){if(!g.def(t).naval)return{x:p.home.x+3,y:p.home.y+3};const dock=ready.find(b=>g.def(b).kind==='dock');return dock?waterBeside(dock):null;}
 if(carrier){carrier.aiLogistics=true;if(!s.sortie&&carrier.order&&(carrier.stuck>2||g.def(carrier).naval&&Number.isFinite(carrier.order.x)&&g.blocked(carrier.order.x,carrier.order.y,'water',p.id)))g.order([carrier.id],{kind:'stop'});if(s.sortie){const op=s.sortie,units=op.ids.map(id=>g.entity(id)).filter(Boolean);units.forEach(u=>u.aiLogistics=op.phase==='load'||!!u.embarkedBy);if(op.phase==='cross'){op.landedIds||=[];for(const u of units)if(!u.embarkedBy&&!op.landedIds.includes(u.id)){op.landedIds.push(u.id);if(op.target.recon)u.aiReconUntil=g.time+150;g.order([u.id],{kind:'attackMove',x:op.target.x,y:op.target.y});}}if(op.phase==='load'){
   if(carrier.returning)return;if(dist(carrier,op.pickup)>2){if(!carrier.order)g.order([carrier.id],{kind:'move',...op.pickup});}
   else{for(const u of units)if(!u.embarkedBy&&u.order?.kind!=='board')g.board([u.id],carrier.id,p.id);const load=g.transportLoad(carrier);if(load.length>=Math.min(6,units.length)||load.length>=3&&g.time-op.started>35){for(const u of units)if(!u.embarkedBy){u.aiLogistics=false;if(u.order?.kind==='board')g.order([u.id],{kind:'stop'});}op.ids=load.map(u=>u.id);op.phase='cross';g.order([carrier.id],{kind:'unload',...op.landing});}}
  }else if(op.phase==='cross'&&!g.transportLoad(carrier).length){op.landed=true;for(const u of units){u.aiLogistics=false;g.order([u.id],{kind:'attackMove',x:op.target.x,y:op.target.y});}s.sortie=null;g.order([carrier.id],{kind:'move',...pickup(carrier)});s.nextSortie=g.time+15;}
  else if(op.phase==='cross'&&!carrier.returning&&!carrier.order)g.order([carrier.id],{kind:'unload',...op.landing});
  if(s.sortie&&g.time-op.started>(op.budget||180+g.n*2/(g.def(carrier).speed||1))){s.needAirTransport=true;for(const u of units)if(!u.embarkedBy)u.aiLogistics=false;s.sortie=null;g.order([carrier.id],{kind:'unload',...pickup(carrier)});}
 }}else if(s.sortie){for(const id of s.sortie.ids){const u=g.entity(id);if(u)u.aiLogistics=false;}s.sortie=null;}
 for(const u of own.filter(u=>u.aiReconUntil&&!u.embarkedBy)){
  if(ctx.targets.length||u.aiReconUntil<g.time){delete u.aiReconUntil;u.aiLogistics=false;continue;}
  u.aiLogistics=true;if(!u.order||u.stuck>3){const A=root.FractureAI||(typeof require!=='undefined'?require('./ai.js'):null),q=A.explorationGoal(g,p,u,ctx);if(q)g.order([u.id],{kind:'attackMove',x:q.x,y:q.y});}
 }
 if(g.time<s.next)return;s.next=g.time+5;
 const maritime=['rivers','narrows','continental','small-islands','large-islands','mediterranean','coastal'].includes(g.options.layout),probe=workers[0]||ctx.military.find(u=>!g.def(u).air);
 let target=null;for(const t of [...ctx.targets].sort((a,b)=>(['hq','inf','armor','air','elite'].includes(g.def(b)?.kind)?1:0)-(['hq','inf','armor','air','elite'].includes(g.def(a)?.kind)?1:0)).slice(0,5)){if(!probe)break;const q=g.approach(probe,t,2),path=g.path(probe,q);if(dist(path.at(-1)||probe,q)>4){target=t;break;}}
 if(!target&&maritime)target=ctx.knownEnemies.find(e=>e.kind==='unit'&&!D.units[e.type]?.air&&!D.units[e.type]?.naval&&dist(e,p.home)>20);
 // A fleet cannot see a headquarters deep inside an island. Land a paid scouting
 // party on charted foreign shore instead of circling forever waiting to see a base.
 if(!target&&maritime&&carrier&&g.def(carrier).naval&&probe&&!ctx.targets.length){
  const candidates=[];for(let y=Math.max(2,Math.floor(carrier.y)-48);y<Math.min(g.n-2,carrier.y+48);y+=3)for(let x=Math.max(2,Math.floor(carrier.x)-48);x<Math.min(g.n-2,carrier.x+48);x+=3){
   const q={x:x+.5,y:y+.5},i=y*g.n+x;if(!p.explored[i]||g.blocked(q.x,q.y,false,p.id)||dist(q,p.home)<20||unsafe(q))continue;
   let gain=0;for(let dy=-8;dy<=8;dy+=4)for(let dx=-8;dx<=8;dx+=4)if(x+dx>=0&&y+dy>=0&&x+dx<g.n&&y+dy<g.n&&!p.explored[(y+dy)*g.n+x+dx])gain++;
   if(!gain)continue;const water=waterBeside(q);if(water&&dist(water,q)<2.8)candidates.push({...q,water,score:gain*5-dist(q,carrier)*.2});
  }
  for(const q of candidates.sort((a,b)=>b.score-a.score).slice(0,8)){if(dist(g.path(probe,q).at(-1)||probe,q)<3||dist(g.path(carrier,q.water).at(-1)||carrier,q.water)>2)continue;target={...q,size:.3,recon:true};break;}
 }
 if(target&&probe&&!s.sortie){const choice=g.transportChoices(probe,target,ctx.enemy).find(c=>c.carrier);if(choice){carrier=g.entity(choice.carrier);s.needAirTransport=choice.mode==='air';}}
 s.needsTransport=!!target||maritime&&!ctx.targets.length||!!p.aiSustainability?.relocation;
 // Fund the crossing before speculative technology. A new ship is not a failed
 // naval plan merely because the global match clock is already several minutes old.
 s.transportWanted=(target||maritime&&g.time>100||p.aiSustainability?.relocation)&&workers.length>=4? p.faction+(maritime&&!s.needAirTransport?'_transport_ship':'_air_transport'):null;
 // Compare paid replacements at infrastructure that actually exists, rather
 // than letting the map name decide between a ship and an aircraft.
 if(target&&probe&&s.transportWanted){const plans=[];
  for(const suffix of ['transport_ship','air_transport']){const def=D.units[p.faction+'_'+suffix],facility=ready.find(b=>b.type===def.building);if(!facility||g.missing(p.id,def,facility).length)continue;
   const model={kind:'unit',type:def.id,owner:p.id,id:-1,hp:def.hp,x:facility.x,y:facility.y,flight:63,refuelOrigin:{x:facility.x,y:facility.y,id:facility.id}},start=g.approach(model,facility,1.7);Object.assign(model,start);
   const pickup=def.naval?g.approach(probe,facility,1):probe,dest=g.approach(probe,target,2),choice=g.transportChoices({...probe,...pickup},dest,ctx.enemy,[model]).find(c=>c.carrier);
   if(choice)plans.push({type:def.id,score:choice.score+def.time+def.cost.reduce((sum,v)=>sum+v,0)/8});
  }if(plans.length)s.transportWanted=plans.sort((a,b)=>a.score-b.score)[0].type;
 }
 if(carrier&&g.def(carrier).naval&&!ctx.targets.length){
  const explored=p.explored.reduce((n,v)=>n+(v?1:0),0);
  if(s.navalSurvey?.id!==carrier.id||explored>(s.navalSurvey?.explored||0)+12)s.navalSurvey={id:carrier.id,explored,at:g.time};
  if(g.time-s.navalSurvey.at>120)s.needAirTransport=true;
 }
 if(!s.expansion&&!s.sortie&&g.time>(s.nextExpansion||100)&&workers.length>=(p.aiSustainability?.relocation?4:8)){
  s.nextExpansion=g.time+30;const w=workers.find(u=>!u.aiLogistics&&!['extract','build','repair'].includes(u.order?.kind));
  const nodes=Object.values(p.knowledge||{}).filter(n=>n.kind==='resource'&&n.amount>180&&!unsafe(n)&&dist(n,p.home)>20).sort((a,b)=>(p.aiSustainability?.relocation?Number(b.resource===0)-Number(a.resource===0):0)||(p.stock[a.resource]-(p.aiSustainability?.cost[a.resource]||0))-(p.stock[b.resource]-(p.aiSustainability?.cost[b.resource]||0))||b.amount-a.amount).slice(0,8);
  if(w)for(const node of nodes){const goal=g.approach(w,node,2),ground=g.path(w,goal);if(dist(ground.at(-1)||w,goal)<2)continue;
   const docks=ready.filter(b=>g.def(b).kind==='dock'),departures=[{x:w.x,y:w.y},...docks.map(b=>g.approach(w,b,1))];let best=null;
   for(const departure of departures){if(dist(g.path(w,departure).at(-1)||w,departure)>2)continue;for(let k=0;k<12;k++){const a=k*Math.PI/6,q={x:node.x+Math.cos(a)*4,y:node.y+Math.sin(a)*4},i=Math.floor(q.y)*g.n+Math.floor(q.x);if(!p.explored[i]||g.blocked(q.x,q.y,false,p.id)||unsafe(q))continue;
    for(const choice of g.transportChoices({...w,...departure},q,ctx.enemy)){if(!choice.carrier||choice.carrier===s.sortie?.carrier)continue;const score=choice.score+dist(w,departure)/g.def(w).speed;if(!best||score<best.score)best={...choice,score,departure,landing:q};}
   }}
   if(!best)continue;const t=g.entity(best.carrier),depot=D.factions[p.faction].buildings.find(b=>b.kind==='depot'||b.kind==='extractor'&&b.resource===D.resources[node.resource]);if(!depot||!g.affordable(p.id,depot.cost))continue;const party=workers.filter(u=>!u.aiLogistics&&!['extract','build','repair'].includes(u.order?.kind)&&dist(u,w)<12).slice(0,2);if(party.length<2)continue;
   const guards=ctx.military.filter(u=>!g.def(u).air&&!g.def(u).naval&&!u.aiLogistics&&dist(u,w)<14).slice(0,2);party.push(...guards);
   const pickup=g.def(t).naval?g.coastApproach(t,best.departure):best.departure;if(!pickup)continue;
   s.expansion={depot:depot.id,carrier:t.id,ids:party.map(u=>u.id),node:node.id,pickup,landing:best.landing,phase:'load',started:g.time,budget:120+best.score*3};party.forEach(u=>u.aiLogistics=true);g.order([t.id],{kind:'move',...pickup});p.plan='Transporting workers and guards to an observed resource island';break;
  }
 }
 if(carrier&&!s.sortie&&!s.expansion&&!p.aiSustainability?.relocation&&g.time>(s.nextSortie||0)&&!carrier.returning){
  if(target){const available=ctx.military.filter(u=>!g.def(u).air&&!g.def(u).naval&&g.def(u).damage>0&&!u.embarkedBy&&u.hp>u.maxHp*.65);let embark=pickup(carrier),group=available;
   // Collect stranded forward armies as well as fresh units at the home dock.
   const anchor=[...available].sort((a,b)=>available.filter(u=>dist(u,b)<8).length-available.filter(u=>dist(u,a)<8).length||dist(a,target)-dist(b,target))[0];
   if(anchor){if(!g.def(carrier).naval)embark={x:anchor.x,y:anchor.y};else{let best=Infinity;for(let r=2;r<=15;r+=3)for(let k=0;k<12;k++){const a=k*Math.PI/6,q=waterBeside({x:anchor.x+Math.cos(a)*r,y:anchor.y+Math.sin(a)*r});if(!q||unsafe(q)||dist(q,anchor)>best)continue;const land=g.approach(anchor,{...q,size:.4},1),route=g.path(anchor,land);if(dist(route.at(-1)||anchor,q)<2.8&&dist(g.path(carrier,q).at(-1)||carrier,q)<2){embark=q;best=dist(q,anchor);}}}}
   if(embark)group=available.filter(u=>{const q=g.approach(u,{...embark,size:.4},1),route=g.path(u,q);return dist(route.at(-1)||u,embark)<2.8;});
   const troops=group.sort((a,b)=>(['siege','tank'].includes(g.def(a).role)?-3:0)-(['siege','tank'].includes(g.def(b).role)?-3:0)||dist(a,carrier)-dist(b,carrier)).slice(0,10);
   let landing=null;const candidates=[];if(target.recon)candidates.push({q:target,water:waterBeside(target),score:-1});
   for(let r=9;r<=31;r+=2)for(let k=0;k<16;k++){const a=k*Math.PI/8,q={x:target.x+Math.cos(a)*r,y:target.y+Math.sin(a)*r},i=Math.floor(q.y)*g.n+Math.floor(q.x);if(!p.explored[i]||g.blocked(q.x,q.y,false,p.id)||unsafe(q))continue;const water=g.def(carrier).naval?waterBeside(q):q;if(!water||g.def(carrier).naval&&dist(water,q)>2.8)continue;
    const ax=q.x-carrier.x,ay=q.y-carrier.y,len=ax*ax+ay*ay||1,risk=ctx.enemy.filter(e=>{if(!g.def(e)?.aa&&!g.def(carrier).naval)return false;const f=Math.max(0,Math.min(1,((e.x-carrier.x)*ax+(e.y-carrier.y)*ay)/len));return dist(e,{x:carrier.x+ax*f,y:carrier.y+ay*f})<g.range(e)+3;}).length;
    candidates.push({q,water,score:dist(carrier,q)+r*.35+risk*35});
   }
   for(const {q,water}of candidates.sort((a,b)=>a.score-b.score).slice(0,12)){if(g.def(carrier).naval&&dist(g.path(carrier,water).at(-1)||carrier,water)>2)continue;if(g.def(carrier).air&&((dist(carrier,embark||carrier)+dist(embark||carrier,q))/g.def(carrier).speed+8>(carrier.flight||0)||!g.eligibleAirfields({...carrier,...q}).length))continue;const route=g.path({...probe,...q},g.approach(probe,target,2));if(dist(route.at(-1)||q,target)<(target.size||.4)+4){landing=q;break;}}
   if(troops.length>=3&&!landing){s.noLandingSince??=g.time;if(g.time-s.noLandingSince>35)s.needAirTransport=true;}else s.noLandingSince=null;
   if(troops.length>=3&&landing){s.sortie={carrier:carrier.id,pickup:embark||{x:carrier.x,y:carrier.y},ids:troops.map(u=>u.id),target:{x:target.x,y:target.y,recon:!!target.recon},landing,phase:'load',started:g.time,budget:120+(dist(carrier,embark||carrier)+dist(embark||carrier,landing))*2.5/(g.def(carrier).speed||1)};troops.forEach(u=>u.aiLogistics=true);g.order([carrier.id],{kind:'move',...s.sortie.pickup});p.plan='Preparing a transport landing beyond the enemy defenses';}
  }if(!s.sortie&&!carrier.order){const goal=g.def(carrier).naval?seaGoal(carrier):(root.FractureAI||(typeof require!=='undefined'?require('./ai.js'):null)).explorationGoal(g,p,carrier,ctx);if(goal)g.order([carrier.id],{kind:'move',x:goal.x,y:goal.y});}
 }
 if(carrier&&!s.sortie&&!s.expansion&&!carrier.order&&!carrier.returning&&g.def(carrier).naval){const q=seaGoal(carrier);if(q)g.order([carrier.id],{kind:'move',x:q.x,y:q.y});}
 // Air wings assemble before flying into defended territory. They keep their
 // attack wind-ups, concentrate on one exposed objective and withdraw together.
 const aircraft=own.filter(e=>e.kind==='unit'&&g.def(e).air&&!g.def(e).transport),wing=aircraft.filter(u=>!u.returning&&u.hp>u.maxHp*.5);
 aircraft.forEach(u=>u.aiLogistics=true);
 if(s.airRaid&&!g.entity(s.airRaid.target)&&g.visible(p.id,s.airRaid))s.airRaid=null;
 if(s.airRaid&&(wing.length<Math.max(2,s.airRaid.initial*.4)||g.time-s.airRaid.started>85)){for(const u of aircraft)if(!u.returning&&!u.windup)g.order([u.id],{kind:'move',x:p.home.x+3,y:p.home.y+3});s.airRaid=null;s.airRegroup=g.time+15;}
 if(!s.airRaid&&wing.length>=(ctx.enemy.filter(e=>g.def(e)?.aa&&!g.def(e)?.worker).length<3?2:3)&&g.time>(s.airRegroup||0)){
  const objectives=ctx.targets.filter(t=>wing.some(u=>!g.def(u).airOnly)).map(t=>({t,score:(['hq','air','inf','armor','elite'].includes(g.def(t)?.kind)?100:40)-ctx.knownEnemies.filter(e=>g.def(e)?.aa&&dist(e,t)<10).length*12-dist(t,p.home)*.25})).sort((a,b)=>b.score-a.score);
  if(objectives.length){const t=objectives[0].t;s.airRaid={target:t.id,x:t.x,y:t.y,initial:wing.length,started:g.time};g.order((ctx.config.domainMicro?wing.filter(u=>!(u.aiDomainTargetUntil>g.time)&&!u.windup):wing).map(u=>u.id),{kind:'attackMove',x:t.x,y:t.y});p.plan='Coordinated air strike on enemy production';}
 }
 for(const u of aircraft){if(u.returning||u.windup||u.aiDomainTargetUntil>g.time)continue;if(u.hp<u.maxHp*.35){g.order([u.id],{kind:'move',x:p.home.x+3,y:p.home.y+3});continue;}
  const local=ctx.enemy.filter(e=>g.canTarget(u,e)&&dist(u,e)<=g.attackReach(u,e)+2).sort((a,b)=>(g.def(b)?.aa?50:0)-(g.def(a)?.aa?50:0)||(a.hp-b.hp));
  if(local.length){if(u.order?.target!==local[0].id)g.order([u.id],{kind:'attack',target:local[0].id});}
  else if(s.airRaid&&(!u.order||u.stuck>2))g.order([u.id],{kind:'attackMove',x:s.airRaid.x,y:s.airRaid.y});
  else if(!s.airRaid&&!u.order&&ctx.targets.length)g.order([u.id],{kind:'move',x:p.home.x+4,y:p.home.y+4});
  else if(!s.airRaid&&!u.order&&!ctx.targets.length){const A=root.FractureAI||(typeof require!=='undefined'?require('./ai.js'):null),q=A.explorationGoal(g,p,u,ctx);if(q)g.order([u.id],{kind:'move',x:q.x,y:q.y});}
 }
 if(s.lastExpansion?.depot&&!unsafe(s.lastExpansion)){
  const site=s.lastExpansion,d=D.buildings[site.depot],crew=workers.filter(w=>!w.aiLogistics&&dist(w,site)<18&&!['build','repair','extract'].includes(w.order?.kind));
  if(crew.length&&!own.some(b=>b.kind==='building'&&['hq','depot','extractor'].includes(g.def(b)?.kind)&&dist(b,site)<10)&&canBuy(d))g.aiBuild(p,d,crew,g.entity(site.node)||site);
 }
 if(s.lastExpansion&&g.time-s.lastExpansion.at>12&&!unsafe(s.lastExpansion)){
  const dock=D.buildings[p.faction+'_dock'],near=workers.filter(u=>dist(u,s.lastExpansion)<18&&!['build','repair','extract'].includes(u.order?.kind));
  if(near.length&&!own.some(b=>b.type===dock.id&&dist(b,s.lastExpansion)<24)&&dock.cost.every((v,i)=>p.stock[i]-v>=(p.aiReserve?.[i]||0))){let built=false;for(let r=3;r<19&&!built;r+=2)for(let k=0;k<16;k++){const a=k*Math.PI/8,q={x:s.lastExpansion.x+Math.cos(a)*r,y:s.lastExpansion.y+Math.sin(a)*r};if(unsafe(q)||g.placement(dock.id,p.id,q.x,q.y))continue;const spot=g.approach(near[0],{...q,size:dock.size},1);if(dist(g.path(near[0],spot).at(-1)||near[0],spot)>2)continue;built=g.build(dock.id,p.id,q.x,q.y,[near[0].id]).ok;if(built)break;}}
 }
 // Fortify charted narrow land approaches with ordinary paid towers. The
 // cliff tests use remembered terrain, never hidden enemy geography.
 if(ctx.config.level>=6&&g.time>(s.nextFortification||180)&&!unsafe(p.home)){
  s.nextFortification=g.time+45;const tower=D.factions[p.faction].buildings.find(b=>b.kind==='defense'),w=workers.find(u=>!u.aiLogistics&&!['build','repair','extract'].includes(u.order?.kind));
  if(tower&&w&&tower.cost.every((v,i)=>p.stock[i]-v>=(p.aiReserve?.[i]||0)+60)){
   const closed=(x,y,h)=>{const i=Math.floor(y)*g.n+Math.floor(x);return x>=0&&y>=0&&x<g.n&&y<g.n&&p.explored[i]&&((p.knownTiles[i]&128)||Math.abs((p.knownTiles[i]&127)-h)>=2);};
   let site=null;for(let r=12;r<=26&&!site;r+=2)for(let k=0;k<24;k++){const a=k*Math.PI/12,q={x:Math.floor(p.home.x+Math.cos(a)*r)+.5,y:Math.floor(p.home.y+Math.sin(a)*r)+.5},i=Math.floor(q.y)*g.n+Math.floor(q.x);if(!p.explored[i]||unsafe(q)||g.placement(tower.id,p.id,q.x,q.y)||own.some(b=>g.def(b)?.kind==='defense'&&dist(b,q)<14))continue;
    const h=p.knownTiles[i]&127,narrow=closed(q.x-4,q.y,h)&&closed(q.x+4,q.y,h)||closed(q.x,q.y-4,h)&&closed(q.x,q.y+4,h);if(!narrow&&!(r===12&&ctx.knownEnemies.some(e=>dist(e,q)<dist(e,p.home))))continue;const dest=g.approach(w,{...q,size:tower.size},1);if(dist(g.path(w,dest).at(-1)||w,dest)<2){site=q;break;}}
   if(site)g.build(tower.id,p.id,site.x,site.y,[w.id]);
  }
 }
 // A small paid defensive position leaves a broad escape lane. Walls protect
 // the tower flanks; concealed mines cover the approach, not our collection paths.
 if(ctx.config.level>=6&&g.time>(s.nextTraps||160)){
  s.nextTraps=g.time+12;
  const towers=ready.filter(b=>g.def(b).kind==='defense'&&!unsafe(b)),w=workers.find(u=>!u.aiLogistics&&!['build','repair','extract'].includes(u.order?.kind));
  if(w)for(const tower of towers){
   const contact=[...ctx.knownEnemies].filter(e=>g.time-(e.seenAt||0)<100).sort((a,b)=>dist(a,tower)-dist(b,tower))[0],toward=contact||{x:g.n/2,y:g.n/2},angle=(s.fortificationAngles||={})[tower.id]??(s.fortificationAngles[tower.id]=Math.atan2(toward.y-tower.y,toward.x-tower.x)),dx=Math.cos(angle),dy=Math.sin(angle);
   const sites=[['trap',4,0],['trap',6,1.8],['wall',1.5,-3.5],['wall',1.5,3.5],['wall',2.7,-3.5],['wall',2.7,3.5]];
   let built=false;for(const [kind,forward,side]of sites){const d=D.buildings[p.faction+'_'+kind],q={x:Math.floor(tower.x+dx*forward-dy*side)+.5,y:Math.floor(tower.y+dy*forward+dx*side)+.5};
    if(!canBuy(d)||!g.affordable(p.id,d.cost)||own.some(b=>g.def(b).kind===kind&&dist(b,q)<1.3)||unsafe(q)||g.placement(d.id,p.id,q.x,q.y))continue;
    if(own.some(u=>u.kind==='unit'&&dist(u,q)<d.size+1)||Object.values(p.knowledge||{}).some(n=>n.kind==='resource'&&dist(n,q)<4))continue;
    const goal=g.approach(w,{...q,size:d.size},1.3);if(dist(g.path(w,goal).at(-1)||w,goal)>1.5)continue;
    if(g.build(d.id,p.id,q.x,q.y,[w.id]).ok){built=true;s.ambushAnchor={x:tower.x,y:tower.y,tower:tower.id};break;}
   }if(built)break;
  }
 }
 // A secured expansion can support a paid forward aviation facility. It is
 // considered only with a working economy and uses ordinary worker construction.
 if(s.lastExpansion&&ctx.config.level>=7&&g.time-s.lastExpansion.at>30&&!unsafe(s.lastExpansion)){
  const air=D.factions[p.faction].buildings.find(b=>b.kind==='air'),near=own.filter(u=>g.def(u)?.worker&&dist(u,s.lastExpansion)<18&&!['build','repair'].includes(u.order?.kind));
  if(air&&near.length&&!own.some(b=>b.type===air.id&&dist(b,s.lastExpansion)<25)&&!g.missing(p.id,air).length&&air.cost.every((v,i)=>p.stock[i]-v>=(p.aiReserve?.[i]||0)+40))g.aiBuild(p,air,near,s.lastExpansion);
 }
 // New renewable economy uses the same paid prerequisite and worker orders as players.
 if(workers.length>=1&&!unsafe(p.home)){
  const exhausted=Object.values(p.knowledge||{}).filter(e=>e.kind==='resource'&&e.amount<=0&&!unsafe(e));
  for(const r of [0,1,2,3]){const rich=Object.values(p.knowledge||{}).some(e=>e.kind==='resource'&&e.resource===r&&e.amount>120&&dist(e,p.home)<18);if(!exhausted.some(e=>e.resource===r))continue;
   const id=p.faction+'_deep_'+D.resources[r],b=ready.find(b=>b.type===id);if(!b)continue;
   const assigned=workers.filter(w=>w.order?.kind==='extract'&&w.order.target===b.id);
   // Count miners inside the shaft too. Renewable extraction is slower than a
   // reachable surface deposit, so keep it as a reserve while useful ore remains.
   const surface=Object.values(p.knowledge||{}).filter(n=>n.kind==='resource'&&n.resource===r&&n.amount>120&&!unsafe(n)&&dist(n,p.home)<35);
   const probe=workers.find(w=>!w.insideMine),usable=probe&&surface.some(n=>{const q=g.approach(probe,n,.7),route=g.path(probe,q);return dist(route.at(-1)||probe,q)<2;});
   const needed=r===0?usable?Math.min(4,Math.floor(workers.length*.15)):Math.min(16,Math.max(4,Math.floor(workers.length*.55))):p.stock[r]<160?4:0;
   for(const w of assigned.slice(needed))if(!w.carry)g.order([w.id],{kind:'stop'});
   for(const w of workers.filter(w=>!['extract','build','repair'].includes(w.order?.kind)&&!w.aiLogistics).sort((a,c)=>dist(a,b)-dist(c,b)).filter(w=>{const q=g.approach(w,b,1);return dist(g.path(w,q).at(-1)||w,q)<2;}).slice(0,Math.max(0,needed-assigned.length)))g.order([w.id],{kind:'extract',target:b.id});
  }
  if(g.time>360&&p.stock[0]>300){const id=p.faction+'_market',markets=ready.filter(b=>b.type===id);if(!markets.length)ensure(id);else if(markets.length<2&&!own.some(b=>b.type===id&&b.progress<1)){const w=workers.find(w=>!['extract','build','repair'].includes(w.order?.kind));if(w&&canBuy(D.buildings[id]))g.aiBuild(p,D.buildings[id],[w],{x:p.home.x+16,y:p.home.y});}else if(markets.length>=2){const merchants=own.filter(u=>g.def(u).role==='merchant');if(canBuy(D.units[p.faction+'_merchant'])&&merchants.length<2&&!own.some(b=>b.queue?.some(q=>q.type===p.faction+'_merchant')))g.queue(markets[0].id,p.faction+'_merchant');for(const u of merchants)if(!u.order)g.order([u.id],{kind:'trade',target:markets[1].id});}}
  if((p.tradeCredits||0)>=20){const resource=p.stock.map((v,i)=>v-(p.aiSustainability?.cost[i]||0)).reduce((best,v,i,a)=>v<a[best]?i:best,0);g.exchange(p.id,resource);}
 }
 if(g.time>200&&!unsafe(p.home)){
  const docks=ready.filter(b=>g.def(b).kind==='dock'&&!unsafe(b)),type=p.faction+'_merchant_ship',ships=own.filter(u=>u.type===type);
  for(const ship of ships){ship.aiLogistics=true;if(ship.order)continue;const destinations=docks.filter(b=>dist(ship,b)>8&&g.tradeLeg(ship,b)).sort((a,b)=>dist(ship,b)-dist(ship,a));for(const b of destinations){g.order([ship.id],{kind:'trade',target:b.id});if(ship.order)break;}}
  if(ships.length<2&&!pending(type)&&docks.length>1){
   const probe={...docks[0],kind:'unit',type,owner:p.id},start=g.approach(probe,docks[0],1);Object.assign(probe,start,{type,kind:'unit'});
   const profitable=docks.slice(1).some(b=>dist(b,docks[0])>=12&&!unsafe(b)&&g.tradeLeg(probe,b));
   const d=D.units[type],b=docks.find(b=>!b.queue.length);if(profitable&&b&&d.cost.every((v,i)=>p.stock[i]-v>=(p.aiReserve?.[i]||0)))g.queue(b.id,type);
  }
 }
 if(maritime&&(ctx.enemy.some(e=>g.def(e)?.naval)||carrier&&g.time>220)){
  const id=p.faction+'_dock';if(ensure(id)){const b=ready.find(b=>b.type===id&&!b.queue.length),fleet=own.filter(e=>g.def(e)?.naval&&!g.def(e).transport),enemyAir=ctx.knownEnemies.some(e=>g.def(e)?.air);
   // Size the paid fleet to observed opposition; aircraft call for escorts, not more cannons.
   const contacts=ctx.knownEnemies.filter(e=>g.def(e)?.naval&&!g.def(e).transport),adapt=ctx.config.domainMicro,limit=Math.min(8,2+Math.floor((ctx.config.level-5)*1.2));
   const warships=adapt?Math.min(limit,Math.max(2,contacts.length+1)):2;
   const escorts=adapt?Math.min(4,Math.max(enemyAir?2:1,Math.ceil(ctx.knownEnemies.filter(e=>g.def(e)?.air).length/2))):enemyAir?2:g.time>330?1:0;
   const wanted=[['scout_boat',!ctx.targets.length?1:0],['escort_ship',escorts],['warship',warships],['siege_ship',g.time>360?(adapt&&ctx.targets.length>2?2:1):0]];
   for(const [suffix,count]of wanted){const u=D.units[p.faction+'_'+suffix];if(fleet.filter(e=>e.type===u.id).length>=count||pending(u.id))continue;let allowed=true;for(const req of u.requires)if(!done(req)){ensure(req);allowed=false;break;}if(allowed&&b&&canBuy(u))g.queue(b.id,u.id);break;}
  }
 }
 const navalEscort=carriers.find(t=>g.def(t).naval);
 for(const ship of own.filter(e=>g.def(e)?.naval&&g.def(e).damage>0)){if(ctx.config.domainMicro&&ship.windup||ship.aiDomainTargetUntil>g.time)continue;if(ship.stuck>2||ship.order?.kind==='move'&&g.blocked(ship.order.x,ship.order.y,'water',p.id))g.order([ship.id],{kind:'stop'});const target=ctx.enemy.filter(e=>g.canTarget(ship,e)&&dist(e,ship)<g.range(ship)+(e.size||0)+3).sort((a,b)=>dist(a,ship)-dist(b,ship))[0];if(target&&ship.order?.target!==target.id)g.order([ship.id],{kind:'attack',target:target.id});else if(!target&&g.def(ship).navalRole==='scout'&&!ship.order){const q=seaGoal(ship);if(q)g.order([ship.id],{kind:'move',x:q.x,y:q.y});}else if(!target&&navalEscort&&g.def(ship).navalRole!=='scout'&&(!ship.order||dist(ship,navalEscort)>9)){const q=g.coastApproach(ship,navalEscort);if(q)g.order([ship.id],{kind:'move',x:q.x,y:q.y});}else if(!target&&!navalEscort&&!ship.order){const t=ctx.targets.find(t=>waterBeside(t));if(t){const q=waterBeside(t);g.order([ship.id],{kind:'move',...q});}}}
}
root.FractureAILogistics={step};if(typeof module!=='undefined')module.exports=root.FractureAILogistics;
})(globalThis);
