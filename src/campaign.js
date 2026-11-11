/* Campaign simulation: deterministic mission rules, real movement and combat, no UI dependencies. */
'use strict';
(function(root){
const D=root.FD||(typeof require!=='undefined'?require('./data.js'):null);
const defs=()=>root.FractureCampaignMissions||(typeof require!=='undefined'?require('./campaign-missions.js'):null);
const sim=()=>root.FractureSim||(typeof require!=='undefined'?require('./simulation.js'):null);
const resourceIndex=v=>typeof v==='string'?Math.max(0,D.resources.indexOf(v)):(v??0);
const copy=v=>JSON.parse(JSON.stringify(v)),distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const point=(g,p)=>({x:Math.max(4,Math.min(g.n-5,(p?.x??.15)*g.n)),y:Math.max(4,Math.min(g.n-5,(p?.y??.75)*g.n))});
function get(id){const key=typeof id==='number'?'m'+String(id).padStart(2,'0'):String(id).replace(/^mission_/, 'm');return defs().get(key)||defs().get(id);}
function unitDefinition(faction,spec={}){
 const f=D.factions[faction],role=typeof spec==='string'?spec:spec.role;
 if(spec.type&&D.units[spec.type])return D.units[spec.type];
 const exact=f.units.find(u=>role==='worker'?u.worker:u.role===role);if(exact)return exact;
 const groups={ranged:['rifle','archer','mage','spitter'],melee:['melee','brute','giant'],infantry:['rifle','melee','mage'],heavy:['tank','giant','brute'],artillery:['siege'],air:['fighter','bomber'],healer:['support'],antiAir:['aa','rifle'],scout:['scout']};
 return f.units.find(u=>(groups[role]||[]).includes(u.role))||f.units.find(u=>!u.worker&&u.damage>0&&!u.air&&!u.special&&!u.extension&&!u.research)||f.units[1];
}
function buildingDefinition(faction,kind){return D.buildings[kind]||D.factions[faction].buildings.find(b=>b.kind===kind)||D.factions[faction].buildings.find(b=>b.kind==='inf');}
function note(g,message,id){const c=g.campaign;g.say(message,0);c.lastMessage=message;c.events.push({id:id||'note-'+c.events.length,message,time:g.time});if(c.events.length>80)c.events.shift();}
function flatten(g,p,r,height=0){for(let y=Math.floor(p.y-r);y<=p.y+r;y++)for(let x=Math.floor(p.x-r);x<=p.x+r;x++){const t=g.tile(x,y);if(t&&Math.hypot(x+.5-p.x,y+.5-p.y)<r){t.water=false;t.height=height;}}}
function corridor(g,a,b,width=3.8){const steps=Math.ceil(distance(a,b)*2);for(let i=0;i<=steps;i++){const f=i/Math.max(1,steps),p={x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f};flatten(g,p,width);const t=g.tile(p.x,p.y);if(t)t.road=true;}}
function openSpot(g,p,r=1){for(let ring=0;ring<15;ring++){const count=Math.max(1,ring*8);for(let k=0;k<count;k++){const a=k/count*Math.PI*2,x=Math.floor(p.x+Math.cos(a)*ring)+.5,y=Math.floor(p.y+Math.sin(a)*ring)+.5;if(x<2||y<2||x>g.n-3||y>g.n-3||g.blocked(x,y))continue;if(g.entities.some(e=>e.hp>0&&['building','resource'].includes(e.kind)&&distance(e,{x,y})<(e.size||1)+r+.8))continue;if(g.entities.some(e=>e.hp>0&&e.kind==='unit'&&distance(e,{x,y})<.55))continue;return{x,y};}}throw Error('Campaign has no clear spawn position.');}
function scriptDestination(g,u,p){const s=g.campaign?.sites.find(s=>distance(s,p)<.6),e=s&&g.entity(s.entityId);let q=e?g.approach(u,e,2):p;if(g.blocked(q.x,q.y,!!g.def(u).air))q=openSpot(g,q,.3);return q;}
function spawnSquad(g,owner,specs,p,order=null){const out=[];for(const spec of specs||[]){const d=unitDefinition(g.players[owner].faction,spec);for(let k=0;k<(spec.count||1);k++){const q=openSpot(g,p,.3),u=g.spawnUnit(d.id,owner,q.x,q.y);u.campaignSpawn=true;out.push(u);if(order){const target=order.x!==undefined?scriptDestination(g,u,order):{};g.order([u.id],{...order,...target});}}}return out;}
function addBuilding(g,owner,kind,p,tag){const d=buildingDefinition(g.players[owner].faction,kind),q=openSpot(g,p,d.size),b=g.spawnBuilding(d.id,owner,q.x,q.y,true);if(tag)b.campaignTag=tag;g.rebuildNav();return b;}
function reveal(g,p,r=9){const player=g.players[0];for(let y=Math.max(0,Math.floor(p.y-r));y<Math.min(g.n,p.y+r);y++)for(let x=Math.max(0,Math.floor(p.x-r));x<Math.min(g.n,p.x+r);x++)if(Math.hypot(x-p.x,y-p.y)<r){const i=y*g.n+x,t=g.tile(x,y);player.explored[i]=1;player.knownTiles[i]=(t.height||0)|(t.water?128:0);player.knownNav[i]=g.nav[i];}}
function siteById(g,id){return g.campaign.sites.find(s=>s.id===id);}
function targetFor(g,o){return siteById(g,o.target)||g.campaign.sites.find(s=>s.id===o.targetTag)||{...g.players[0].home,radius:6};}
function teamUnits(g,owner=0){return g.entities.filter(e=>e.kind==='unit'&&e.hp>0&&!e.campaignCivilian&&!e.campaignEscort&&!e.campaignResearcher&&!g.hostile(owner,e.owner));}
function enemiesNear(g,p,r=7){return g.entities.filter(e=>e.hp>0&&e.owner!==undefined&&g.hostile(0,e.owner)&&!e.campaignImmune&&!e.campaignLocked&&['unit','building'].includes(e.kind)&&distance(e,p)<r);}
function friendNear(g,p,r=7){return teamUnits(g).some(e=>!g.def(e).air&&distance(e,p)<r);}
function activeObjective(g,o){return !o.complete&&(o.stage||1)<=g.campaign.stage&&(o.requires||[]).every(id=>g.campaign.objectives.find(q=>q.id===id)?.complete);}
function unlockTargets(g){for(const s of g.campaign.sites){const e=g.entity(s.entityId);if(!e)continue;const blockers=g.campaign.objectives.filter(o=>o.target===s.id&&!o.optional&&o.type==='destroy');e.campaignLocked=blockers.length>0&&!blockers.some(o=>activeObjective(g,o));}}
function complete(g,o){const c=g.campaign;if(o.complete)return;o.complete=true;o.progress=o.amount??o.duration??1;o.completedAt=g.time;const s=targetFor(g,o),e=g.entity(s.entityId);if(['capture','activate','disable'].includes(o.type)){s.secured=true;if(e){e.owner=0;e.campaignImmune=o.type==='disable';if(o.type==='activate')e.hp=e.maxHp;g.rebuildNav();g.updateVision();}}if(o.id==='containment'&&c.emperor){c.emperor.contained=true;for(const b of c.landmarks.filter(b=>b.kind==='shed-tail'))b.contained=true;}note(g,'Objective completed: '+o.label,o.id+'-complete');}
function finish(g,status,reason){const c=g.campaign;if(c.status!=='active')return;c.status=status;c.finishedAt=g.time;c.result=reason;c.checkpointRequested=false;g.winner=status==='victory'?g.players[0].team:-1;note(g,reason,'mission-'+status);}
function prepareEvacuation(g,o){if(o.evacIds)return;const c=g.campaign,source=siteById(g,o.source)||c.sites.find(s=>s.kind==='rescue')||g.players[0].home,destination=targetFor(g,o);o.evacIds=[];o.arrivedIds=[];o.startedAt=g.time;const total=o.available||Math.max((o.amount||4)+2,Math.ceil((o.amount||4)*1.25));
 for(let i=0;i<total;i++){const u=spawnSquad(g,0,[{role:o.unitRole||'worker',count:1}],source)[0];u.campaignCivilian=!o.unitRole||o.unitRole==='worker';u.campaignEscort=true;u.campaignObjective=o.id;u.campaignName=o.groupName|| (o.type==='escort'?'Supply carrier':'Evacuee');if(o.type==='escort'){u.carry=8;u.carryType=0;}u.campaignSafe=false;o.evacIds.push(u.id);}
 reveal(g,source);reveal(g,destination);note(g,total+' adult civilians are ready. Bring troops to their marked position, then keep the evacuation road clear.',o.id+'-ready');
}
function updateEvacuation(g,o,dt){prepareEvacuation(g,o);const dest=targetFor(g,o);for(const id of o.evacIds){if(o.arrivedIds.includes(id))continue;const u=g.entity(id);if(!u)continue;if(distance(u,dest)<(o.radius||5)){o.arrivedIds.push(id);u.campaignSafe=true;u.hp=0;u.order=null;continue;}if(!u.campaignDeparted&&friendNear(g,u,9)){u.campaignDeparted=true;g.order([u.id],{kind:'move',x:dest.x,y:dest.y});}if(u.campaignDeparted&&!u.order)g.order([u.id],{kind:'move',x:dest.x,y:dest.y});}
 o.progress=o.arrivedIds.length;const possible=o.progress+o.evacIds.filter(id=>g.entity(id)&&!o.arrivedIds.includes(id)).length;if(possible<(o.amount||4)){finish(g,'defeat','Too few civilians survived to complete the evacuation. Retry the latest checkpoint.');return;}if(o.progress>=(o.amount||4))complete(g,o);
}
function updateResearchCrew(g,o){const spec=o.researcherCrew;if(!spec)return true;const site=targetFor(g,o);if(!o.researcherIds){const crew=spawnSquad(g,0,[{role:'worker',count:spec.count||2}],{x:g.players[0].home.x+3,y:g.players[0].home.y+5});o.researcherIds=crew.map(u=>u.id);for(const u of crew){u.campaignResearcher=o.id;u.campaignName=spec.name||'Research specialist';}note(g,'The research team is travelling from the command post. Protect at least '+(spec.required||1)+' specialist until the work is complete.',o.id+'-research-team');}
 const alive=o.researcherIds.map(id=>g.entity(id)).filter(Boolean);o.researchersAlive=alive.length;if(alive.length<(spec.required||1)){finish(g,'defeat','The research team was lost before its work was complete. Retry the latest checkpoint.');return false;}
 for(const u of alive){const entity=g.entity(site.entityId),destination=entity?g.approach(u,entity,2):site;if(distance(u,destination)>1.8){if(!u.order||u.order.kind!=='move'||Math.hypot(u.order.x-destination.x,u.order.y-destination.y)>2)g.order([u.id],{kind:'move',x:destination.x,y:destination.y});}else if(u.order?.kind!=='hold')g.order([u.id],{kind:'hold'});}
 o.researchersOnSite=alive.filter(u=>distance(u,site)<(o.radius||site.radius||7)).length;return o.researchersOnSite>=(spec.required||1);
}
function updateProductionRate(g){const m=get(g.campaign.missionId),rule=m?.interference,finished=!rule||g.campaign.objectives.some(o=>o.id===rule.untilObjective&&o.complete);g.campaign.productionRate=finished?1:Math.max(.1,Math.min(1,rule.productionRate||.75));}
function mEmperor(g){return !!get(g.campaign.missionId)?.emperorEncounter;}
function evaluate(g,o,dt){const c=g.campaign,s=targetFor(g,o),e=g.entity(s.entityId),radius=o.radius||s.radius||7;
 if(o.requiresTailShed&&!c.emperor?.tailShed)return;
 if(o.id==='containment'&&mEmperor(g)&&c.emperor?.phase!=='escaped')return;
 if(o.researcherCrew&&!updateResearchCrew(g,o))return;
 switch(o.type){
 case 'protect':if(s.entityId&&!e){finish(g,'defeat',(s.name||o.label)+' was lost. Retry the latest checkpoint.');return;}o.progress=e?e.hp/e.maxHp:1;o.complete=true;break;
 case 'destroy':o.progress=s.entityId&&!e?1:0;if(o.progress)complete(g,o);break;
 case 'capture':case 'activate':case 'disable':o.contested=!!enemiesNear(g,s,radius).length;if(friendNear(g,s,radius)&&!o.contested)o.progress=(o.progress||0)+dt;if(o.progress>=(o.duration||12))complete(g,o);break;
 case 'reach':case 'explore':o.progress=teamUnits(g).filter(u=>u.owner===0&&!g.def(u).air&&(!(o.amount>1)||!g.def(u).worker)&&distance(u,s)<radius).length;if(o.progress>=(o.amount||1))complete(g,o);break;
 case 'hold':case 'defend':if(s.entityId&&!e&&s.kind==='protect'){finish(g,'defeat',s.name+' was lost.');break;}if(friendNear(g,s,radius)||e?.owner===0){if(!enemiesNear(g,s,radius).length)o.progress=(o.progress||0)+dt;}if(o.progress>=(o.duration||90))complete(g,o);break;
 case 'gather':o.progress=Math.max(0,g.players[0].gathered[resourceIndex(o.resource)]-(o.baseline||0));if(o.progress>=(o.amount||60))complete(g,o);break;
 case 'produce':o.progress=Object.entries(c.production).reduce((n,[id,count])=>n+((o.entityType?id===o.entityType:o.role?D.units[id]?.role===o.role:o.worker?D.units[id]?.worker:!D.units[id]?.worker)?count:0),0);if(o.progress>=(o.amount||3))complete(g,o);break;
 case 'research':o.progress=g.players[0].tech.includes(o.researchId)?1:0;if(o.progress)complete(g,o);break;
 case 'build':o.progress=g.entities.filter(b=>b.kind==='building'&&b.owner===0&&b.progress>=1&&!c.initialBuildings.includes(b.id)&&(o.entityType?b.type===o.entityType:o.buildingKind?g.def(b).kind===o.buildingKind:true)).length;if(o.progress>=(o.amount||1))complete(g,o);break;
 case 'repair':o.progress=e?e.hp/e.maxHp:0;if(o.progress>=(o.amount||.95))complete(g,o);break;
 case 'escort':case 'evacuate':updateEvacuation(g,o,dt);break;
 default:throw Error('Unsupported campaign objective: '+o.type);
 }
}
function runEvent(g,e){const c=g.campaign,p=e.spawn?point(g,e.spawn):targetFor(g,{target:e.target});if(e.message)note(g,e.message,e.id);switch(e.action|| (e.units?'reinforce':'message')){
 case 'reinforce':{const owner=e.owner??0;spawnSquad(g,owner,e.units||[{role:'rifle',count:3}],p,e.order||null);break;}
 case 'reveal':reveal(g,p,e.radius||12);break;
 case 'supplies':(e.resources||e.stock||[100,0,0,0]).forEach((v,i)=>g.players[0].stock[i]+=v);break;
 case 'message':break;
 default:throw Error('Unsupported campaign event: '+e.action);
 }}
function waveTime(g,w){return w.stage?g.time-(g.campaign.stageStarted[w.stage]??Infinity):g.time;}
function processScripts(g){const c=g.campaign,m=get(c.missionId);for(const w of m.waves||[]){if(w.stage&&w.stage!==c.stage||c.fired.includes('wave:'+w.id))continue;const elapsed=waveTime(g,w),when=(w.at||0)*c.pressure.delay;if(elapsed>=when-18&&!c.warned.includes(w.id)){c.warned.push(w.id);const p=point(g,w.spawn||{x:.84,y:.23});reveal(g,p,5);note(g,'Enemy reinforcements are approaching. Their entry point is marked on the map.','warning:'+w.id);c.alerts.push({...p,id:w.id,expires:g.time+35});}if(elapsed<when)continue;c.fired.push('wave:'+w.id);const p=point(g,w.spawn||{x:.84,y:.23}),target=siteById(g,w.target)||g.players[0].home,owner=w.owner??1,units=(w.units||[]).map(q=>({...q,count:Math.max(1,Math.round((q.count||1)*c.pressure.count))}));spawnSquad(g,owner,units,p,{kind:'attackMove',x:target.x,y:target.y});note(g,'Enemy force sighted near '+(siteById(g,w.target)?.name||'our position')+'.','wave:'+w.id);}
 for(const e of m.events||[]){if(c.fired.includes('event:'+e.id)||e.stage&&e.stage!==c.stage)continue;const elapsed=e.stage?g.time-(c.stageStarted[e.stage]??Infinity):g.time;if(e.at!==undefined&&elapsed<e.at)continue;if(e.after&&!c.objectives.find(o=>o.id===e.after)?.complete)continue;c.fired.push('event:'+e.id);runEvent(g,e);}
 c.alerts=c.alerts.filter(a=>a.expires>g.time);
}

function updateConvoys(g){for(const s of g.campaign.sites.filter(s=>s.kind==='convoy')){
 const goal=g.campaign.objectives.find(o=>o.target===s.id&&o.type==='destroy');if(!goal||goal.complete||!activeObjective(g,goal))continue;
 if(!s.convoyOrigin)s.convoyOrigin={x:s.x,y:s.y};const end=point(g,s.destination||{x:.85,y:.2});
 if(!s.entityId){const due=s.convoyNextAt??(g.campaign.stageStarted[goal.stage||1]+(s.departureDelay||0));if(g.time<due)continue;
  const squad=spawnSquad(g,s.owner??1,s.convoyUnits||[{role:'worker',count:1}],s.convoyOrigin,{kind:'move',...end});const lead=squad[0];s.entityId=lead.id;lead.campaignName=s.name;lead.campaignConvoy=true;s.convoyEscortIds=spawnSquad(g,s.owner??1,s.guards||[],{x:s.convoyOrigin.x+2,y:s.convoyOrigin.y+2},{kind:'attackMove',...end}).map(u=>u.id);note(g,s.name+' is moving along the marked supply road.','convoy-'+s.id+'-'+lead.id);
 }
 const lead=g.entity(s.entityId);if(!lead)continue;s.x=lead.x;s.y=lead.y;goal.x=s.x;goal.y=s.y;
 if(distance(lead,end)<4){lead.hp=0;for(const id of s.convoyEscortIds||[]){const guard=g.entity(id);if(guard&&distance(guard,end)<12)guard.hp=0;}s.entityId=null;s.x=s.convoyOrigin.x;s.y=s.convoyOrigin.y;s.convoyNextAt=g.time+60;goal.x=s.x;goal.y=s.y;note(g,s.name+' escaped. Another supply convoy follows in one minute; the objective remains possible.','convoy-repeat-'+s.id+'-'+Math.floor(g.time));}
 else if(!lead.order)g.order([lead.id],{kind:'move',...end});
 }}
function update(g,dt){const c=g.campaign;if(!c||c.status!=='active')return;const m=get(c.missionId);if(!m)throw Error('Unknown campaign mission in save.');updateProductionRate(g);
 for(const o of c.objectives.filter(o=>o.type==='protect')){const s=targetFor(g,o);if(s.entityId&&!g.entity(s.entityId)){finish(g,'defeat',(s.name||o.label)+' was destroyed. Retry the latest checkpoint.');return;}}
 const owned=g.entities.filter(e=>e.owner===0&&e.hp>0);if(!owned.some(e=>e.kind==='unit'&&!e.campaignCivilian||e.kind==='building'&&['hq','inf','armor','air','elite','counter'].includes(g.def(e).kind))){finish(g,'defeat','Your command force was lost. Retry the latest checkpoint.');return;}
 updateConvoys(g);for(const o of c.objectives){o.active=activeObjective(g,o);if(o.active)evaluate(g,o,dt);if(c.status!=='active')return;}
 processScripts(g);updateEmperor(g);if(g.time>=(c.nextAllyOrder||0)){c.nextAllyOrder=g.time+8;const goal=c.objectives.find(o=>o.active&&!o.optional&&!['produce','build','gather','protect','research'].includes(o.type));if(goal){const dest=targetFor(g,goal);for(const owner of c.alliedOwners||[]){const squad=g.entities.filter(e=>e.owner===owner&&e.kind==='unit'&&!g.def(e).worker&&!e.windup);for(const u of squad){const target=g.entity(dest.entityId),p=target?g.approach(u,target,2):g.blocked(dest.x,dest.y,!!g.def(u).air,u.owner)?openSpot(g,dest,.3):dest;if(distance(u,p)>2&&(!u.order||u.order.kind!=='attackMove'||Math.hypot(u.order.x-p.x,u.order.y-p.y)>3))g.order([u.id],{kind:'attackMove',x:p.x,y:p.y});}}}}const required=c.objectives.filter(o=>!o.optional&&(o.stage||1)===c.stage&&o.type!=='protect');c.stageWait=required.length&&required.every(o=>o.complete)?Math.max(0,(m.stageMinimums?.[c.stage]||0)*c.pressure.delay-(g.time-(c.stageStarted[c.stage]||0))):0;if(required.length&&required.every(o=>o.complete)&&g.time-(c.stageStarted[c.stage]||0)>=(m.stageMinimums?.[c.stage]||0)*c.pressure.delay){const next=Math.min(...c.objectives.filter(o=>!o.optional&&!o.complete&&(o.stage||1)>c.stage).map(o=>o.stage));if(Number.isFinite(next)){c.stage=next;c.stageStarted[next]=g.time;c.stageTitle=m.stages?.find(s=>Number(s.id)===next)?.title||'Stage '+next;c.checkpointRequested='stage-'+next;note(g,'New orders: '+c.stageTitle+'. '+c.objectives.filter(o=>!o.optional&&(o.stage||1)===next).map(o=>o.label).join('. '),'stage-'+next);unlockTargets(g);}else if(c.objectives.filter(o=>!o.optional&&o.type!=='protect').every(o=>o.complete)){finish(g,'victory',m.victoryText||'Mission complete. Your objectives are secured.');}}
 unlockTargets(g);for(const o of c.objectives)o.active=activeObjective(g,o);
}
function create(missionId,difficulty='standard'){
 const m=get(missionId);if(!m)throw Error('Unknown mission '+missionId);const A=root.FractureAI||(typeof require!=='undefined'?require('./ai.js'):null),level=A.configFor(difficulty).level||4;
 const allied=(m.allies||[]).map(a=>typeof a==='string'?a:a.faction),factions=[m.faction,m.enemyFaction||m.enemies?.[0]?.faction||'symbiotes',...allied,m.faction],neutral=factions.length-1;
 const g=new (sim().Game)({size:m.size||100,seed:m.seed||7000+m.number,theme:m.theme||m.biome||'Kareth',environment:m.environment,layout:m.layout||'natural',factions,teams:[0,1,...allied.map(()=>0),0],difficulty,startingResources:false,resourceAmount:.5,resourcePlacement:'balanced'});
 const decor=g.entities.filter(e=>e.kind==='tree');g.entities=[];g.projectiles=[];g.effects=[];g.nextId=1;g.players.forEach(p=>{p.ai=false;p.stock=[0,0,0,0];p.tech=[];p.special=0;p.gathered=[0,0,0,0];p.explored.fill(0);p.visible.fill(0);p.knownNav.fill(0);p.knownTiles.fill(0);p.knowledge={};});
 const home=point(g,m.start||{x:.15,y:.77}),enemy=point(g,m.enemyStart||{x:.85,y:.2}),sites=(m.sites||[]).map(s=>({...copy(s),...point(g,s)}));g.players[0].home=home;g.players[1].home=enemy;g.starts[0]=home;g.starts[1]=enemy;g.players[neutral].home=home;
 g.campaign={version:1,revision:m.campaignRevision||1,missionId:m.id,number:m.number,title:m.title,status:'active',stage:1,stageTitle:m.stages?.[0]?.title||'Opening orders',stageStarted:{1:0},objectives:(m.objectives||[]).map(o=>({...copy(o),label:o.text||o.label||o.id,...(o.type==='gather'?{resource:resourceIndex(o.resource)}:{}),complete:false,active:(o.stage||1)===1,progress:0,...(o.target&&sites.find(s=>s.id===o.target)?{x:sites.find(s=>s.id===o.target).x,y:sites.find(s=>s.id===o.target).y}:{x:home.x,y:home.y})})),sites,events:[],fired:[],warned:[],alerts:[],production:{},initialBuildings:[],checkpointRequested:'start',difficulty,pressure:{count:level<=2?.7:level<=4?1:level<=6?1.15:level<=8?1.35:1.55,delay:level<=2?1.2:level<=4?1:level<=6?.95:.85},neutralOwner:neutral,alliedOwners:allied.map((_,i)=>i+2)};
 // The mission routes are authored from its sites. Clear broad paths and staging areas,
 // preserving the surrounding generated cliffs, forests, coast and material detail.
 flatten(g,home,17);flatten(g,enemy,10);for(const s of sites){flatten(g,s,9);if(s.kind==='convoy'){const end=point(g,s.destination);flatten(g,end,6);corridor(g,s,end,4);}}let previous=home;for(const s of sites){corridor(g,previous,s,4.2);previous=s;}for(const s of sites)corridor(g,home,s,3.5);corridor(g,enemy,sites.find(s=>s.kind==='destroy')||home,4);
 for(const w of m.waves||[]){const p=point(g,w.spawn||{x:.84,y:.23});flatten(g,p,6);corridor(g,p,sites.find(s=>s.id===w.target)||home,3.5);}
 const keep=decor.filter(e=>distance(e,home)>18&&distance(e,enemy)>12&&sites.every(s=>distance(e,s)>10)&&!g.tile(e.x,e.y)?.road);for(const e of keep){let close=false;for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++)if(g.tile(e.x+dx,e.y+dy)?.road)close=true;if(!close)g.add({...e});}g.rebuildNav();
 const offsets=[[0,0],[-7,0],[0,-7],[7,0],[-7,-7],[7,-7],[-7,7],[7,7],[0,12],[-12,0],[12,0],[0,-12]];
 const buildingKinds=[...new Set(m.startingBuildings||['hq','inf','house'])];if(!buildingKinds.includes('hq'))buildingKinds.unshift('hq');if(!buildingKinds.includes('house'))buildingKinds.push('house');
 buildingKinds.forEach((kind,i)=>{const off=offsets[i%offsets.length];addBuilding(g,0,kind,{x:home.x+off[0],y:home.y+off[1]},'base-'+kind);});
 addBuilding(g,1,'hq',enemy,'enemy-command');addBuilding(g,1,'inf',{x:enemy.x-6,y:enemy.y},'enemy-production');spawnSquad(g,1,[{role:'rifle',count:3}],{x:enemy.x-3,y:enemy.y+5},{kind:'hold'});
 for(let a=0;a<allied.length;a++){const owner=a+2,p=point(g,(m.allies[a]?.at)||{x:.18+a*.09,y:.37});g.players[owner].home=p;g.starts[owner]=p;flatten(g,p,10);corridor(g,p,home);addBuilding(g,owner,'hq',p);const squad=spawnSquad(g,owner,[{role:'rifle',count:4},{role:'support',count:1}],{x:p.x+4,y:p.y+4});g.players[owner].stock=[500,200,200,60];for(const u of squad){const p=openSpot(g,{x:home.x+6,y:home.y-6},.3);g.order([u.id],{kind:'attackMove',x:p.x,y:p.y});}}
 // Resource deposits are separate clusters beside the base, with one expansion per region.
 const resourceCenters=[{x:home.x-10,y:home.y+7},{x:home.x+11,y:home.y+8},{x:home.x+9,y:home.y-11},{x:home.x-10,y:home.y-11}];for(let r=0;r<4;r++){const center=resourceCenters[r];flatten(g,center,5);corridor(g,home,center,3);for(let k=0;k<3;k++){const q=openSpot(g,{x:center.x+(k-1)*2.8,y:center.y+(k%2)*2.4},.6);g.add({kind:'resource',resource:r,...q,hp:1,amount:r===3?1500:4500,maxAmount:r===3?1500:4500,size:r===3?.65:.85});g.rebuildNav();}if(r===1){const well=D.factions[m.faction].buildings.find(b=>b.resource==='oil');if(well)addBuilding(g,0,well.id,{x:center.x-3,y:center.y-2},'starting-oil-well');}}
 for(const s of sites){if(s.id==='home'&&s.kind==='protect'){const base=g.entities.find(e=>e.owner===0&&e.kind==='building'&&g.def(e).kind==='hq');s.entityId=base.id;s.x=base.x;s.y=base.y;base.campaignTag=s.id;base.campaignName=s.name;continue;}if(s.kind==='exit'||s.kind==='reach'||s.kind==='convoy')continue;let owner=s.owner;if(owner===undefined)owner=s.kind==='destroy'?1:s.kind==='protect'?0:neutral;const selectedFaction=s.faction||g.players[owner].faction,d=buildingDefinition(selectedFaction,s.building|| (s.kind==='destroy'?'defense':'depot')),p=openSpot(g,s,d.size),b=g.spawnBuilding(d.id,owner,p.x,p.y,true);b.campaignTag=s.id;b.campaignName=s.name;b.campaignFaction=selectedFaction;s.entityId=b.id;b.campaignImmune=['capture','rescue','activate','disable'].includes(s.kind);if(s.hpFraction)b.hp=b.maxHp*s.hpFraction;g.rebuildNav();const guards=s.guards??(['destroy','capture','activate','disable'].includes(s.kind)?[{role:'rifle',count:m.number<=3?2:3}]:[]);if(guards.length)spawnSquad(g,1,guards,{x:s.x+4,y:s.y+3},{kind:'hold'});}
 for(const s of sites.filter(s=>s.resource!==undefined)){const r=resourceIndex(s.resource);for(let k=0;k<(s.resourceCount||3);k++){const q=openSpot(g,{x:s.x-4+(k%2)*2.7,y:s.y-4+Math.floor(k/2)*2.7},.6),amount=s.resourceAmount||3000;g.add({kind:'resource',resource:r,...q,hp:1,amount,maxAmount:amount,size:r===3?.65:.85,campaignTag:s.id+'-resource'});g.rebuildNav();}}
 if(m.harbor)prepareHarbor(g,m);
 g.players[0].stock=[...(m.startingResources||[900,240,240,100])];g.players[0].tech=[...(m.startingTech||[])];if(m.researchLevel)for(const r of D.factions[m.faction].research)if(['weapons','armor'].includes(r.kind)&&/[123]$/.test(r.id)&&Number(r.id.slice(-1))<=m.researchLevel)g.players[0].tech.push(r.id);
 const specs=m.startingUnits||[{role:'worker',count:6},{role:'rifle',count:8},{role:'support',count:1}];spawnSquad(g,0,specs.filter(s=>s.role==='worker'),{x:home.x-5,y:home.y+4});spawnSquad(g,0,specs.filter(s=>s.role!=='worker'),{x:home.x+2,y:home.y+5});if(!g.entities.some(e=>e.owner===0&&e.kind==='unit'&&g.def(e).worker))spawnSquad(g,0,[{role:'worker',count:6}],{x:home.x+3,y:home.y+4});
 // Surplus capacity avoids a trap when campaign starting squads are larger than a skirmish start.
 for(let k=0;g.capacity(0)<g.population(0)+12&&k<6;k++)addBuilding(g,0,'house',{x:home.x-8+k*3,y:home.y+12});
 g.campaign.initialBuildings=g.entities.filter(e=>e.kind==='building').map(e=>e.id);for(const o of g.campaign.objectives)if(o.type==='gather')o.baseline=g.players[0].gathered[resourceIndex(o.resource)];
 const landmarks=root.FractureCampaignLandmarks||(typeof require!=='undefined'?(()=>{try{return require('./campaign-landmarks.js');}catch(e){if(e.code==='MODULE_NOT_FOUND')return null;throw e;}})():null);if(landmarks?.decorate)landmarks.decorate(g,m);
 updateProductionRate(g);g.rebuildNav();g.updateVision();for(const s of sites)reveal(g,s,5);reveal(g,home,18);unlockTargets(g);for(const o of g.campaign.objectives)if(o.type==='protect')o.complete=true;note(g,m.briefing||m.title,'briefing');return g;
}

function prepareHarbor(g,m){
 const shore=Math.floor(g.n*.9);
 // The bottom strip is a connected navigable sea; keep every inland objective and base intact.
 for(let y=shore;y<g.n;y++)for(let x=0;x<g.n;x++){const t=g.tile(x,y);t.water=true;t.height=0;t.road=false;}
 for(let y=shore-4;y<shore;y++)for(let x=2;x<g.n-2;x++){const t=g.tile(x,y);t.water=false;t.height=0;t.road=true;}
 g.entities=g.entities.filter(e=>e.y<shore-1||e.kind!=='tree');g.rebuildNav();
 const x=Math.floor(g.n*.23)+.5,y=shore-.5,d=D.buildings[m.faction+'_dock'];
 const dock=g.spawnBuilding(d.id,0,x,y,true);dock.campaignName='Supply harbor';g.rebuildNav();
 const ferry=g.spawnUnit(m.faction+'_transport_ship',0,x+3,shore+3);ferry.campaignName=D.units[ferry.type].name;
 const s=siteById(g,'harbor');if(s){s.x=x;s.y=y;s.entityId=dock.id;}
 const blockade=siteById(g,'blockade');if(blockade){const foe=g.spawnUnit(m.enemyFaction+'_scout_boat',1,Math.floor(g.n*.56)+.5,shore+3);foe.campaignName='Coastal blockade vessel';g.order([foe.id],{kind:'hold'});blockade.x=foe.x;blockade.y=foe.y;blockade.entityId=foe.id;blockade.kind='destroy';for(const o of g.campaign.objectives.filter(o=>o.target==='blockade')){o.x=foe.x;o.y=foe.y;}reveal(g,foe,8);}
 reveal(g,{x,y},13);g.campaign.harbor={x,y,shore,dock:dock.id,ferry:ferry.id};
}
function updateEmperor(g){
 const c=g.campaign,m=get(c.missionId);if(!m.emperorEncounter)return;
 if(c.stage>=3&&!c.emperor){
  const site=siteById(g,'imperial'),u=spawnSquad(g,1,[{role:'heavy',count:1}],site,{kind:'hold'})[0];
  u.campaignEmperor=true;u.campaignName='Reptilian Emperor';u.campaignLocked=true;
  c.emperor={id:u.id,tailShed:false,phase:'guarded'};reveal(g,site,12);
  note(g,'The Emperor directs the invasion from the crossing. Silence his siege camp, then advance and drive him back.','emperor-sighted');
 }
 const state=c.emperor;if(!state)return;const u=g.entity(state.id);
 if(u&&!state.tailShed&&c.objectives.find(o=>o.id==='battery')?.complete){u.campaignLocked=false;state.phase='fighting';}
 if(u&&state.tailShed){
  if(g.time-state.shedAt<3){u.order={kind:'hold'};u.path=[];return;}
  const dest=state.escape;if(distance(u,dest)<3){state.phase='escaped';state.escapedAt=g.time;u.hp=0;u.order=null;note(g,'The wounded Emperor reaches the crossing. His discarded tail remains on this side.','emperor-escaped');}
  else if(u.order?.kind!=='move')g.order([u.id],{kind:'move',...dest});
 }
}
function emperorDamage(g,e,value){
 const c=g.campaign,state=c?.emperor;if(!e.campaignEmperor||!state||state.tailShed||e.hp-value>e.maxHp*.38)return false;
 e.hp=Math.max(1,e.maxHp*.38);e.campaignImmune=true;e.campaignTailShed=true;e.windup=null;e.order={kind:'hold'};e.path=[];
 state.tailShed=true;state.shedAt=g.time;state.phase='shedding';const gate=g.entity(siteById(g,'breach')?.entityId);state.escape=gate?g.approach(e,gate,2):{x:g.players[1].home.x-5,y:g.players[1].home.y+5};
 const tail={kind:'shed-tail',x:e.x,y:e.y,face:e.face||0,at:g.time};c.landmarks.push(tail);state.tail={x:e.x,y:e.y};
 for(const id of ['tissue','imperial']){const s=siteById(g,id);s.x=e.x;s.y=e.y;for(const o of c.objectives.filter(o=>o.target===id)){o.x=e.x;o.y=e.y;}}
 c.focus={x:e.x,y:e.y,at:g.time,seconds:4};reveal(g,e,10);
 note(g,'The Emperor sheds his tail to escape! The living tissue falls beside the crossing as he retreats. Keep clear of it; a containment crew will recover it.','emperor-tail-shed');
 return true;
}

function restriction(g,definition,kind){if(!g.campaign||!definition)return null;const m=get(g.campaign.missionId);if(kind==='unit'&&(m.allowedRoles||m.roleLocks)&&!(m.allowedRoles||m.roleLocks).includes(definition.role)&&!(definition.worker&&(m.allowedRoles||m.roleLocks).includes('worker')))return 'This unit is not available in this mission.';if(kind==='building'&&(m.allowedBuildings||m.allowedBuildingKinds)&&!(m.allowedBuildings||m.allowedBuildingKinds).includes(definition.kind))return 'This building is not available in this mission.';return null;}
function recordProduction(g,type){if(g.campaign)g.campaign.production[type]=(g.campaign.production[type]||0)+1;}
const API={create,get,update,emperorDamage,restriction,recordProduction,unitDefinition,siteById,checkpoint:g=>g.serialize(),restore:text=>sim().Game.restore(text)};Object.defineProperty(API,'missions',{get:()=>defs().missions});root.FractureCampaign=API;if(typeof module!=='undefined')module.exports=API;
})(globalThis);
