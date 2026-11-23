'use strict';
// Optional online strategist. It proposes one high-level intent; the deterministic
// local AI remains the sole authority for legality, costs, fog and unit execution.
(function(root){
const D=root.FD||(typeof require!=='undefined'?require('./data.js'):null);
const limit=(xs,n)=>xs.slice(0,n);
function unitSummary(xs){const count={};for(const e of xs){const d=D.units[e.type];if(!d)continue;const key=d.name||e.type;count[key]=(count[key]||0)+1;}return count;}
function unitReference(u){return{id:u.id,name:u.name,role:u.role,cost:u.cost,damage:u.damage||0,range:u.range||0,armor:u.armor||0,air:!!u.air,aa:!!u.aa,bonus:u.bonus||null,requires:u.requires||[],research:u.research||null};}
function contactReference(g,e){const d=e.kind==='unit'?D.units[e.type]:D.buildings[e.type];return{id:e.id,type:e.type,name:d?.name||e.type,kind:e.kind,position:[Math.round(e.x),Math.round(e.y)],hp:Math.round(e.hp||0),seenSecondsAgo:Math.max(0,Math.round(g.time-(e.seenAt??g.time))),role:d?.role||d?.kind||null,damage:d?.damage||0,range:d?.range||0,air:!!d?.air,aa:!!d?.aa};}
function snapshot(g,p,ctx){const own=ctx.own.filter(e=>e.kind==='unit'&&!D.units[e.type]?.worker),f=D.factions[p.faction],visible=ctx.enemy.filter(e=>e.kind==='unit'||e.kind==='building'),targets=limit(ctx.targets||[],8).map(t=>({id:t.id,kind:D.buildings[t.type]?.kind||t.kind,position:[Math.round(t.x),Math.round(t.y)],seenSecondsAgo:Math.round(g.time-(t.seenAt??g.time)),guard:Math.round(t.guard||0)})),ready=ctx.ready.map(b=>({type:b.type,kind:D.buildings[b.type]?.kind,queue:(b.queue||[]).map(q=>q.type)}));
 return {version:2,time:Math.round(g.time),faction:p.faction,economy:{resources:p.stock.map(Math.floor),workers:ctx.workers.length,population:own.length,capacity:typeof g.capacity==='function'?g.capacity(p.id):null,renewablePlan:p.aiSustainability?.resources||[],reservedFor:p.aiSustainability?.ids||[]},ownArmy:unitSummary(own),production:ready,availableUnits:f.units.filter(u=>!u.worker).map(unitReference),availableResearch:(f.research||[]).map(id=>D.research[id]).filter(Boolean).map(r=>({id:r.id,name:r.name,cost:r.cost,requires:r.requires||[]})),visibleEnemy:unitSummary(visible.filter(e=>e.kind==='unit')),intelligence:(ctx.knownEnemies||[]).map(e=>contactReference(g,e)),knownTargets:targets,activePlan:p.plan||null,activeOperation:p.operation?{phase:p.operation.phase,targetId:p.operation.target?.id,units:p.operation.ids?.length||0}:null,allowedActions:['attack','raid','siege','recon','defend','fortify','hold']};
}
function cleanDecision(g,p,ctx,input){if(!input||typeof input!=='object')return null;const action=['attack','raid','siege','recon','defend','fortify','hold'].includes(input.action)?input.action:null;if(!action)return null;const id=Number(input.targetId),target=(ctx.targets||[]).find(t=>t.id===id)||ctx.enemy.find(e=>e.id===id);if(['attack','raid','siege','recon'].includes(action)&&!target)return null;const faction=D.factions[p.faction],units=new Set(faction.units.map(u=>u.id)),research=new Set(faction.research||[]),priority=(xs,allowed)=>Array.isArray(xs)?xs.filter(id=>typeof id==='string'&&allowed.has(id)).slice(0,3):[];
 const decision={action,targetId:target?.id??null,unitPriorities:priority(input.unitPriorities,units),researchPriorities:priority(input.researchPriorities,research),at:g.time,expires:g.time+42,rationale:typeof input.rationale==='string'?input.rationale.slice(0,180):''};
 if(action==='recon')p.aiReconTarget={id:target.id,x:target.x,y:target.y};
 if(['attack','raid','siege'].includes(action))p.aiStrategistTarget=target.id;
 if(action==='defend')p.aiStrategistDefenseUntil=g.time+18;
 if(action==='fortify')p.aiStrategistFortifyUntil=g.time+45;
 if(action==='hold')p.attackAt=Math.max(p.attackAt||0,g.time+10);
 return decision;
}
function request(g,p,ctx){if(!ctx.config.externalStrategy||typeof fetch!=='function')return;const state=p.aiOpenRouter||(p.aiOpenRouter={});if(state.pending||g.time<(state.nextAt||0))return;state.pending=true;state.nextAt=g.time+90;const body={state:snapshot(g,p,ctx)};
 fetch('/api/openrouter/decision',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).then(r=>r.ok?r.json():Promise.reject(new Error('OpenRouter unavailable'))).then(payload=>{const current=(root.FractureAI||{}).context?.(g,p);const accepted=current&&cleanDecision(g,p,current,payload.decision);if(accepted){p.aiStrategistDecision=accepted;p.plan='OpenRouter strategist: '+accepted.action;}state.last=accepted||null;}).catch(()=>{state.last=null;}).finally(()=>{state.pending=false;});
}
const api={snapshot,cleanDecision,request};root.FractureOpenRouter=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
